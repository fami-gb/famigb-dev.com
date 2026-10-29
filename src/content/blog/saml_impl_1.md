---
title: CSの基礎すらままならないけど、SAMLを理解してみる#1
date: "2026-10-29"
description: SAMLにおける署名を学ぶ。
tags: [hash, rsa, sign]
---

## 前回のあらすじ

前回はこのブログの全体像を眺めて、「証明はブラウザを経由して届くので、途中で書き換えられるのでは？」という疑問？テーマを立ててみました。  
今回は前回言った、**鍵(署名・検証)** について扱ってみます。肝心のSAMLはまだ触れません笑。

## 今回のゴール

署名・検証における鍵のペアを作り、データに署名して、検証できるようにします。

資料の`check.py`の`step1()`が通ればゴールです。
<https://github.com/fami-gb/saml-hands-on>

```sh
uv run --with cryptography check.py
# ✅ step1 になれば OK
```

## 前提

ハッシュや鍵を扱う前に、暗号ライブラリでのデータの扱いについて知る必要があります。

### str と bytes の違い

暗号ライブラリが扱うデータは「文字」ではなく「バイト列」です。
コンピュータの中では文字も数字の並びで表されていて、その並びが `bytes` です。`str` を `bytes` にするのが `encode()` です。

```python
>>> "あ".encode()
b'\xe3\x81\x82'
```

「あ」は UTF-8 では3バイトになります。`b"famigb"` のように頭に `b` が付いているのが `bytes` です。この資料の関数が `data: bytes` を受け取るのはこのためです。

### ハッシュ

ハッシュ関数は、どんな長さのデータからも決まった長さの値を作ります。SHA-256 なら、いつも 32 バイトです。

```python
>>> import hashlib
>>> hashlib.sha256(b"famigb").hexdigest()
'f165c88152324e1f9727cb510c94dc3355c68f39881f62d0897d4b4c93cbc3d3'
>>> hashlib.sha256(b"Famigb").hexdigest()
'740d0d966e5fbd8ed8c142120caf7c96a5dde539f8b7e14b82785fc7c1858384'
```

f を F に変えただけで全く別の値になりました。ハッシュには次の性質があります。

- 同じデータからは、必ず同じ値が出る
- 少しでも違うデータからは、まったく違う値が出る
- 値からは元のデータは戻せない

ただ、ハッシュだけでは改竄は防げません。SHA-256は公開されたアルゴリズムで誰でもハッシュを計算することができるからです。
そこで、**鍵**が出てきます。

## 公開鍵と秘密鍵

SAMLの署名ではRSA(RSA-SH256)を使うことが多いです。(必須ではないが、事実上の標準だそう)

> SAML processors SHOULD support the use of RSA signing and verification for public key operations in accordance with the algorithm identified by <http://www.w3.org/2000/09/xmldsig#rsa-sha1>.
>
> ─ [SAML Core 2.0](https://docs.oasis-open.org/security/saml/v2.0/saml-core-2.0-os.pdf) 5.4.1 Signing Formats Algorithms

RSA の鍵はペアで作ります。

- 秘密鍵: 自分だけが持つ。絶対に外に出さない
- 公開鍵: 誰に配ってもいい

この2つには「片方でやったことを、もう片方で確かめられる」という関係があります。使い方は2通りあり、向きが逆です。

| | 使う鍵 | 確かめる鍵 | できること |
| --- | --- | --- | --- |
| 暗号化 | 公開鍵で暗号化 | 秘密鍵で復号 | 誰でも送れるが、読めるのは本人だけ |
| 署名 | 秘密鍵で署名 | 公開鍵で検証 | 作れるのは本人だけだが、誰でも確かめられる |

SAML で主に使うのは署名のほうです。IdP が秘密鍵で署名し、SP は IdP の公開鍵で検証します。SP は「この証明は確かに IdP が作ったもので、途中で書き換えられていない」と確かめられます。

## 実際に書いてみる

ハッシュと鍵について知ったところで、実際に Python で書いてみます。  
書いていくのは資料の `saml_lib.py` のStep 1 になります。

まず、署名と検証で必要になる秘密鍵と公開鍵を作ります。
`generate_private_key` の引数はヒントどおりに設定してみます。

```python
def generate_keypair():
  private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
  public_key = private_key.public_key()
  return (private_key, public_key)
```

次に署名と検証の処理を書きます。  
こちらもヒントに従うのですが、見慣れない引数 `padding.PKCS1v15()` があります。
SHA256 でデータをハッシュ化するのですが、SHA256 は 32 バイト(=256ビット)を出力するため、RSAの 256 バイト(=2048ビット)に届きません。
ここで、`padding.PKCS1v15()` を使うことでハッシュ化されたバイト列をさらに決まった形式で 256 バイトに揃えます。

> [!WARNING]
> 新規のアプリケーションには、PSSを使うことが必須となっています。

> RSASSA-PSS and RSASSA-PKCS1-v1_5.  Although no attacks are known
   against RSASSA-PKCS1-v1_5, in the interest of increased robustness,
   RSASSA-PSS is REQUIRED in new applications.  RSASSA-PKCS1-v1_5 is
   included only for compatibility with existing applications.
>
> ─ <https://www.rfc-editor.org/info/rfc8017> 8. Signature Scheme with Appendix

```python

def sign(private_key, data: bytes) -> bytes:
  return private_key.sign(data, padding.PKCS1v15(), hashes.SHA256())

def verify(public_key, data: bytes, signature: bytes) -> bool:
  # シグネチャ以外のエラーは握りつぶす。(バグと不正な署名の扱いを分けるため)
  try:
    public_key.verify(signature, data, padding.PKCS1v15(), hashes.SHA256)
    return True
  except InvalidSignature:
    return False
```

## 実際に動かしてみる

鍵生成、署名、検証を実装したので実際に動かしてみたいと思います。

```sh
# saml-hands-on直下でpythonを起動
uv run --with cryptography python
```

```python
>>> from saml_lib import *
>>> priv, pub = generate_keypair()
>>> sig = sign(priv, b"famigb")
>>> verify(pub, b"famigb", sig)
True
>>> verify(pub, b"Famigb", sig)
False
>>> _, other_pub = generate_keypair()
>>> verify(other_pub, b"famigb", sig)
False
>>> 
```

鍵を生成し、検証することが出来ました。
一文字でも違う、鍵のペア(公開鍵)が違えば `False` を返してくれています！

## 補足: PKCS1v15 を使わないと何が起きるか

本文では、PKCS1v15 をハッシュ値を RSA の鍵長(256 バイト)に揃えるためのものと紹介しました。  
これはその通りなのですが、パディングにはもう一つ、RSA の「掛け算の性質」を悪用した署名偽造を防ぐ役割があります。

### パディングなしの RSA 署名は掛け合わせられる

RSA の署名は次の式で計算します。($m$: 署名する値、$d$: 秘密鍵の指数、$n$: 2つの大きな素数の積)

$$
s \equiv m^d \pmod{n}
$$

検証では公開鍵の指数 $e$ を使い、$s^e \equiv m \pmod{n}$ が成り立つかを確かめます。

ここで、攻撃者が $m_1$ と $m_2$ の署名 $s_1, s_2$ を手に入れ、2つを掛け合わせたとします。

$$
\begin{aligned}
s_1 \cdot s_2
&\equiv m_1^d \cdot m_2^d \pmod{n} \\
&\equiv (m_1 \cdot m_2)^d \pmod{n}
\end{aligned}
$$

右辺は $m_1 \cdot m_2$ に対する正しい署名そのものです。  
つまり攻撃者は秘密鍵 $d$ を知らなくても、$m_1 \cdot m_2$ の署名を作れてしまいます。

### ハッシュ化するだけでは足りない

「署名するのはハッシュ値なので、$m_1 \cdot m_2$ が都合よく何かのハッシュ値になることはないのでは？」と思うかもしれません。  
確かに、狙ったハッシュ値をピンポイントで作るのは困難です。

ところが SHA-256 の出力は 256 ビットで、$n$(2048 ビット)と比べるとかなり小さな数です。  
小さな数は、小さな素数($2, 3, 5, 7, \dots$)だけの積に分解できる確率が無視できないほど高くなります。  
これを利用すると、次の手順で署名を偽造できます。(Desmedt–Odlyzko 攻撃)

1. たくさんのメッセージのハッシュ値を計算し、小さな素数だけに分解できるものを集める
2. 集めたメッセージに正規の署名をしてもらう
3. 偽造したいメッセージのハッシュ値も小さな素数だけに分解できれば、2. の署名を掛け合わせたり割ったりして、その署名を組み立てる

### PKCS1v15 のパディングで防ぐ

PKCS1v15 では、ハッシュ値をそのまま署名せず、次の形式で 256 バイトに埋めてから署名します。

```
00 01 FF FF ... FF 00 || DigestInfo(ハッシュ方式の識別子) || ハッシュ値
```

これにより、上の攻撃が成り立たなくなります。

- 署名する値が 2048 ビットの大きな数になり、小さな素数だけに分解できる確率が実質ゼロになる
- 署名する値は先頭が `00 01 FF ...` で始まる決まった形をしているため、2つを掛けた $m_1 \cdot m_2 \bmod n$ がこの形になることはまずない

なお、本文の WARNING のとおり、新規のアプリケーションでは PSS が求められています。  
PSS はランダムな値を混ぜてパディングする方式で、同じ攻撃を防ぎつつ、安全性がより厳密に証明されています。

## まとめ

pythonの暗号ライブラリ(cryptography)を使うことで簡単に鍵生成と署名・検証を実装できました。
ハッシュだけでは改竄を防げないこと、秘密鍵を使うことで自分だけの署名を生成できることがわかりました。

本文とは関係ないですが、補足のPKCS1v15の途中の手順はエージェントにかなり壁打ちをしました。  
シグネチャの積が$(m_1 \cdot m_2)^d$ に帰着できてしまうことにはびっくりしました。  
セキュリティはこういった細工で簡単に崩れてしまうと思うと認証基盤の設計の難しさを知りました。

次回はこの署名を使って SAML アサーションに署名してみます。
