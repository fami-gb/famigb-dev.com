---
title: CSの基礎すらままならないけど、SAMLを理解してみる#2
date: "2026-10-30"
description: 意味は同じなのにバイト列が違うXMLの謎を究明します。
tags: [xml, c14n]
---

## 前回のあらすじ

前回は鍵生成と署名・検証について学びました。秘密鍵で署名することで改竄を防ぎ、ペアの公開鍵で検証することで改竄を検知することができました。
今回はSAMLアサーションの署名について扱いたかったのですが、1つ XML と署名に関して厄介な問題があったのでこの章をはさみます。

前回、署名は「 1 バイトでも違えば検証に失敗する」ことを確かめました。改竄を見破るには頼もしい性質ですが、XML に署名しようとすると、これが困った問題になります。

## 今回のゴール

XML を正規化して、意味が同じ XML なら同じバイト列になるようにします。

```sh
uv run --with cryptography check.py
# ✅ step2 になれば OK
```

## 意味は同じなのにバイト列が違う問題

次の2つの XML は意味としては同じです。

```xml
<a y="2" x="1"><b>famigb</b></a>
```

```xml
<a x="1" y="2"><b>famigb</b></a>
```

XMLでは属性の順番に意味はありません。しかし、バイト列としては別物のためハッシュ値は異なります。

```python
>>> a='<a y="2" x="1"><b>famigb</b></a>'
>>> b='<a x="1" y="2"><b>famigb</b></a>'

>>> hashlib.sha256(a.encode()).hexdigest()
'dc099c544a1296ed9fdaa1c2f6d4e1d1c74d19fb7626b9319989adc560f86da5'
>>> hashlib.sha256(b.encode()).hexdigest()
'd5f5b495e804c28a275c16d76c98e3695a43809db4746f144dc0b114e202a6be'
```

SAMLの証明は、IdPで作られ、ブラウザを経由して SP に届きます。その途中や、SP が XML を読み込んで扱う過程で、属性の順番、`<hoge/>` と `<hoge></hoge>` の違いのような「意味は同じだが見た目が違う」ことが起こりえます。そのたびに署名の検証が失敗していては使い物になりません。

## 解決策

そこで、署名する前と検証する前に、XML を決まった形式に揃えます。これを **正規化(Canonicalization)** と言います。  
internationalization や accessibility を i18n や a11y と略すノリで c14n と略すそうです。

整え方のルールは、たとえばこうです。

- 属性は名前順に並べる
- `<hoge/>` は `<hoge></hoge>` にする
- 属性の値は `"` で囲む

署名する側と検証する側が同じルールで整えれば、意味が同じ XML は必ず同じバイト列になります。両方が同じ手順で正規化することが大前提です。

## コード

実際に XML を c14n するコードを書いてみます。
Python には標準ライブラリに `xml.etree.ElementTree.canonicalize` があるのでこれを使います。

```python
def c14n(xml: str) -> bytes:
  # canonicalize は str を返すので encode() して bytes にする。
  return ET.canonicalize(xml).encode()
```

> [!NOTE]
> 本当のSAMLの c14n には `Excl-C14N`(Exclusive C14N 1.0) を使うことが推奨されています。  
> 本文のElementTree の c14n は `C14N 2.0` という別の仕様。
>
> 引用の Exclusive の説明はのちの章に出てくる名前空間と関係があるので、今回は触れません。

> SAML implementations SHOULD use Exclusive Canonicalization [Excl-C14N], with or without comments, both in the <ds:CanonicalizationMethod> element of <ds:SignedInfo>, and as a <ds:Transform> algorithm. Use of Exclusive Canonicalization ensures that signatures created over SAML messages embedded in an XML context can be verified independent of that context.
>
> ─ <https://docs.oasis-open.org/security/saml/v2.0/saml-core-2.0-os.pdf> 5.4.3Canonicalization Method

## 実際に動かしてみる

```python
>>> from saml_lib import c14n

>>> c14n('<a y="2" x="1"><b>famigb</b></a>')
b'<a x="1" y="2"><b>famigb</b></a>'

>>> c14n('<a x="1" y="2"><b>famigb</b></a>')
b'<a x="1" y="2"><b>famigb</b></a>'

>>> c14n('<a><b/></a>')
b'<a><b></b></a>'
```

属性の順番がそろい、`<b/>` が `<b></b>` になりました。

一方、空白は残ります。

```python
>>> c14n('<a y="2" x="1">  <b>famigb</b>  </a>')
b'<a x="1" y="2">  <b>famigb</b>  </a>'
```

c14n は空白も「中身」として扱います。`canonicalize` に `strip_text=True` を付けると前後の空白を消せますが、署名には使いません。`<a>famigb</a>` と `<a> famigb </a>` が同じバイト列になり、値の前後に空白を足す書き換えを許すことになってしまうからです。

前回忘れていましたが、 `check.py` で Step2 が通ることを確認します。

```sh
uv run --with cryptography check.py
# ✅ step2
```

## まとめ

今回は、XML の正規化について学びました。タグの書き方や属性の順番でバイト列が異なる問題を 正規化(c14n) で解決することが出来ました。  
ただ、正規化にも種類があるので署名するときと検証するときで必ず規格を揃えて正規化することが大事だと学びました。
