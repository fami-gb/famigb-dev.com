---
title: CSの基礎すらままならないけど、SAMLを理解してみる#3
date: "2026-11-03"
description: 各要素の意味を深掘りしながら、SAML アサーションを組み立てます。
tags: [assertion]
---

## 前回のあらすじ

前回は XML の正規化(c14n)について学びました。属性の順番やタグの書き方による違いを正規化で取り除けば、署名する側と検証する側でバイト列を揃えられることがわかりました。
今回は、IdP が SP に渡す証明である **Assertion(アサーション)** を組み立ててみます。

## 今回のゴール

`build_assertion` で Assertion の XML を作り、それぞれの要素が何のためにあるのかを説明できるようにします。署名と検証は第 4 回で扱うので、今回は `check.py` での確認はありません。

`build_assertion` が出力する Assertion は次のとおりです。

```xml
<Assertion xmlns="urn:oasis:names:tc:SAML:2.0:assertion" ID="_6c19374367bfb18d01867f160ed5f3df38c3f03e" Version="2.0" IssueInstant="2026-11-02T02:30:04Z">
  <Issuer>http://localhost:5000</Issuer>
  <Subject>
    <NameID Format="urn:oasis:names:tc:SAML:1.1:nameid-format:unspecified">famigb</NameID>
    <SubjectConfirmation Method="urn:oasis:names:tc:SAML:2.0:cm:bearer">
      <SubjectConfirmationData Recipient="http://localhost:5001/acs" NotOnOrAfter="2026-11-02T02:35:04Z" InResponseTo="_req1"/>
    </SubjectConfirmation>
  </Subject>
  <Conditions NotBefore="2026-11-02T02:30:04Z" NotOnOrAfter="2026-11-02T02:35:04Z">
    <AudienceRestriction><Audience>http://localhost:5001</Audience></AudienceRestriction>
  </Conditions>
  <AuthnStatement AuthnInstant="2026-11-02T02:30:04Z">
    <AuthnContext><AuthnContextClassRef>urn:oasis:names:tc:SAML:2.0:ac:classes:Password</AuthnContextClassRef></AuthnContext>
  </AuthnStatement>
  <AttributeStatement><Attribute Name="mail" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:basic"><AttributeValue>famigb@example.com</AttributeValue></Attribute></AttributeStatement>
</Assertion>
```

それぞれのタグには意味があり、守るべきルールもあります。

## アサーションの構造

次の図のような構造で捉えるとわかりやすいです。

![アサーションの構造-手書き](/assertion-struct-handwritten.png)

各要素の役割は、おおまかに次のとおりです。

| 要素 | 意味 |
| --------------- | --------------- |
| Issuer | 誰が発行したか(IdP) |
| Subject | 誰についての主張か(ユーザー) |
| Conditions | いつ、どのサービスで有効か(〇時〜〇時まで、Moodle で、など) |
| AuthnStatement | いつ、どうやって本人確認したか(パスワードでログインした、など) |
| AttributeStatement | ユーザーの付加情報(メールアドレスなど) |

## Assertion

ルートの `Assertion` 要素には、次の3つの属性があり、どれも必須です。

> ─ [SAML Core 2.0](https://docs.oasis-open.org/security/saml/v2.0/saml-core-2.0-os.pdf#page=15) 2.3.3 Element &lt;Assertion&gt;

```xml
<Assertion xmlns="urn:oasis:names:tc:SAML:2.0:assertion" ID="_6c19374367bfb18d01867f160ed5f3df38c3f03e" Version="2.0" IssueInstant="2026-11-02T02:30:04Z">
```

| 属性 | 意味 |
| --- | --- |
| `Version` | SAML のバージョン。`2.0` |
| `ID` | この Assertion を見分けるための ID |
| `IssueInstant` | この Assertion を作った時刻 |

> [!tip] 開始タグにある `xmlns` は SAML の属性ではなく、XML の名前空間の宣言です。後の章で扱います。

### ID の作り方

Assertion の `ID` は W3C の XML Schema で定義された `xs:ID` 型なので、XML 文書の中で一意である必要があります。
さらに SAML Core では、ほかの Assertion などとも偶然重ならないことが求められます。疑似乱数を使う場合は、重なる確率が 2^-128 以下であることが必須、2^-160 以下が推奨です([SAML Core 2.0](https://docs.oasis-open.org/security/saml/v2.0/saml-core-2.0-os.pdf#page=9) 1.3.4 ID and ID Reference Values)。
また、`xs:ID` は NCName(Non-Colonized Name)なので、数字で始めることができません。16 進数の文字列は数字で始まることがあるため、先頭に `_` を付けます。

以下のように `assertion_id` を作れば、条件を満たせます。

```python
import secrets
# 20 bytes = 160 bits
assertion_id = "_" + secrets.token_hex(20)
```

### 時刻はすべて UTC

時刻は `2026-11-02T02:30:04Z` の形式です。IdP と SP が別の国にあっても比べられるように、すべて UTC にそろえます。
ミリ秒より細かい精度には頼るべきではなく、うるう秒を含む時刻を生成してはいけません。

> ─ [SAML Core 2.0](https://docs.oasis-open.org/security/saml/v2.0/saml-core-2.0-os.pdf#page=9) 1.3.3 Time Values

以下のように時刻を文字列にする関数を用意します。

```python
def format_dt(dt):
  return dt.strftime("%Y-%m-%dT%H:%M:%SZ")
```

使うときは、タイムゾーンに UTC を指定した `datetime` を渡します。

```python
from datetime import datetime, timezone
now = datetime.now(timezone.utc)
format_dt(now)
```

3 つの属性をそろえた `<Assertion>` を返す `build_assertion()` を書いてみます。

```python
# 名前空間
NS = "urn:oasis:names:tc:SAML:2.0:assertion"

def build_assertion():
  assertion_id = "_" + secrets.token_hex(20)
  now = datetime.now(timezone.utc)
  issued_at = format_dt(now)

  return f'''
    <Assertion xmlns="{NS}" ID="{assertion_id}" Version="2.0" IssueInstant="{issued_at}">
    </Assertion>
  '''
```

## Issuer

```xml
<Issuer>http://localhost:5000</Issuer>
```

Assertion を発行した IdP の名前です。この名前を entity ID と呼びます。URL の形をしていることが多いですが、アクセスするための場所ではなく、IdP を見分けるための名前です。このブログでは IdP の URL をそのまま entity ID にしています。

Web Browser SSO Profile では、`Issuer` には IdP の entity ID を書くことが必須です。`Format` 属性を付ける場合は、entity ID を表す `urn:oasis:names:tc:SAML:2.0:nameid-format:entity` でなければいけません([SAML Profiles 2.0](https://docs.oasis-open.org/security/saml/v2.0/saml-profiles-2.0-os.pdf#page=18) 4.1.4.2 &lt;Response&gt; Usage)。

SP は、あらかじめ登録しておいた IdP の entity ID と `Issuer` を比べます。知らない IdP が発行した証明は信じません。

ただし、`Issuer` はただの文字列なので、誰でも書けます。攻撃者が自分で作った Assertion に `http://localhost:5000` と書くこともできます。そのため、SP は `Issuer` を見て「どの IdP の公開鍵で署名を確かめるか」を決めるだけで、この時点ではまだ信用しません。本当にその IdP が作ったかどうかは、第 4 回の署名で確かめます。

`Issuer` を `build_assertion()` に足してみます。

```python
def build_assertion(idp_entity_id):
  assertion_id = "_" + secrets.token_hex(20)
  now = datetime.now(timezone.utc)
  issued_at = format_dt(now)

  return f'''
    <Assertion xmlns="{NS}" ID="{assertion_id}" Version="2.0" IssueInstant="{issued_at}">
      <Issuer>{idp_entity_id}</Issuer>
    </Assertion>
  '''
```

## Subject

```xml
<Subject>
  <NameID Format="urn:oasis:names:tc:SAML:1.1:nameid-format:unspecified">famigb</NameID>
  <SubjectConfirmation Method="urn:oasis:names:tc:SAML:2.0:cm:bearer">
    <SubjectConfirmationData Recipient="http://localhost:5001/acs" NotOnOrAfter="2026-11-02T02:35:04Z" InResponseTo="_req1"/>
  </SubjectConfirmation>
</Subject>
```

`Subject` は2つの部分に分かれています。

- `NameID`: 誰についての証明か
- `SubjectConfirmation`: この Assertion を持ってきた人が、その本人だとどうやって確かめるか

### NameID

SP がユーザーを見分けるための名前です。SP はこの値でユーザーを探し、ログインさせます。

```xml
<NameID Format="urn:oasis:names:tc:SAML:1.1:nameid-format:unspecified">famigb</NameID>
```

`Format` 属性は、その名前がどんな種類の値かを表します。仕様には次のようなものが定義されています。

| Format の末尾 | 意味 |
| --- | --- |
| `unspecified` | 形式を特に決めていない |
| `emailAddress` | メールアドレス |
| `persistent` | SP ごとに別の値になる、ずっと変わらない ID |
| `transient` | ログインのたびに変わる、使い捨ての ID |

このブログでは、IdP のユーザー名をそのまま `unspecified` で渡しています。

> [!tip]
> 一覧と詳細は Core 2.0 の 8.3 にあります。
> [SAML Core 2.0](https://docs.oasis-open.org/security/saml/v2.0/saml-core-2.0-os.pdf#page=78)

### SubjectConfirmation

`SubjectConfirmation` は、SP が「いま Assertion を持ってきた相手」と「`NameID` のユーザー」が同じかどうかを確かめるための要素です。確かめられたら、SP はその相手を `NameID` のユーザーとして扱えます。

`SubjectConfirmation` は複数書けて、どれか1つを満たせば十分です。1つもない場合、持ってきた相手とユーザーがどういう関係かは決まっていません。

> ─ [SAML Core 2.0](https://docs.oasis-open.org/security/saml/v2.0/saml-core-2.0-os.pdf#page=18) 2.4.1.1 Element &lt;SubjectConfirmation&gt;

`Method` 属性で、本人の確かめ方を指定します。仕様には3つあります(Profiles 2.0 の 3 Confirmation Method Identifiers)。

```xml
<SubjectConfirmation Method="urn:oasis:names:tc:SAML:2.0:cm:bearer"></SubjectConfirmation>
```

| Method の末尾 | 意味 |
| --- | --- |
| `bearer` | 持ってきた人を本人とみなす |
| `holder-of-key` | 指定された鍵を持っていることを証明できた人を本人とみなす |
| `sender-vouches` | 送ってきた別のサービスが本人だと保証する |

ブラウザを使った SSO では、Web Browser SSO Profile の決まりで `bearer` を使います。  
Web Browser SSO Profile は、Core や [Bindings](https://docs.oasis-open.org/security/saml/v2.0/saml-bindings-2.0-os.pdf) の中から使う要素を選び、制約を加えることで、SP と IdP の間でズレが生じないようにする取り決めです([SAML Profiles 2.0](https://docs.oasis-open.org/security/saml/v2.0/saml-profiles-2.0-os.pdf#page=14) 4.1)。

`bearer` では、SP は Assertion を送ってきたブラウザをそのまま本人のブラウザとして扱い、本当に本人が使っているかまでは確かめません。  
そのため、どこで、いつまで使えるかを Assertion に明示し、SP が検証できるようにしておく必要があります。それを書くのが次の `SubjectConfirmationData` です。

### SubjectConfirmationData

`SubjectConfirmationData` は、`SubjectConfirmation` で本人を確かめるときに使う追加の情報です。中身は確かめ方によって変わり、`holder-of-key` なら鍵の情報(`ds:KeyInfo`)を入れます。`bearer` では、本人として扱ってよい場面を属性で絞り込みます。

> ─ [SAML Core 2.0](https://docs.oasis-open.org/security/saml/v2.0/saml-core-2.0-os.pdf#page=19) 2.4.1.2 Element &lt;SubjectConfirmationData&gt;

```xml
<SubjectConfirmationData Recipient="http://localhost:5001/acs" NotOnOrAfter="2026-11-02T02:35:04Z" InResponseTo="_req1"/>
```

| 属性 | 意味 | SP が確かめること |
| --- | --- | --- |
| `Recipient` | どの URL に届けるための証明か | 自分の ACS(Assertion を受け取る URL)と同じか |
| `NotOnOrAfter` | いつまで本人確認に使えるか | その時刻を過ぎていないか |
| `InResponseTo` | どのログイン要求への返事か | 自分が送った AuthnRequest の ID か |

Web Browser SSO Profile では、`Recipient` と `NotOnOrAfter` は必須で、`InResponseTo` は AuthnRequest への返事なら必須です。一方、`NotBefore` は **付けてはいけません**。

> ─ [SAML Profiles 2.0](https://docs.oasis-open.org/security/saml/v2.0/saml-profiles-2.0-os.pdf#page=18) 4.1.4.2 &lt;Response&gt; Usage

`InResponseTo` の `_req1` は、SP が IdP に送ったログイン要求(AuthnRequest)の ID です。SP は自分が送った要求の ID を覚えておき、それへの返事だけを受け付けます。頼んでいない Assertion を押し付けられるのを防ぐためです。AuthnRequest は後の章で作成します。

ほかに、本人のブラウザの IP アドレスを書く `Address` もあります。ただし任意で、プロキシやロードバランサー、NAT を経由すると、SP から見えるアドレスとブラウザの実際のアドレスが食い違うこともあるため、このブログでは使っていません([SAML Core 2.0](https://docs.oasis-open.org/security/saml/v2.0/saml-core-2.0-os.pdf#page=19) 2.4.1.2 Element &lt;SubjectConfirmationData&gt;)。

`Subject` も `build_assertion()` に足してみます。

```python
from datetime import timedelta

def build_assertion(idp_entity_id, acs_url, username, request_id):
  assertion_id = "_" + secrets.token_hex(20)
  now = datetime.now(timezone.utc)
  issued_at = format_dt(now)
  expires_at = format_dt(now + timedelta(minutes=5))

  return f'''
    <Assertion xmlns="{NS}" ID="{assertion_id}" Version="2.0" IssueInstant="{issued_at}">
      <Issuer>{idp_entity_id}</Issuer>
      <Subject>
        <NameID Format="urn:oasis:names:tc:SAML:1.1:nameid-format:unspecified">{username}</NameID>
        <SubjectConfirmation Method="urn:oasis:names:tc:SAML:2.0:cm:bearer">
          <SubjectConfirmationData Recipient="{acs_url}" NotOnOrAfter="{expires_at}" InResponseTo="{request_id}"/>
        </SubjectConfirmation>
      </Subject>
    </Assertion>
  '''
```

## Conditions

```xml
<Conditions NotBefore="2026-11-02T02:30:04Z" NotOnOrAfter="2026-11-02T02:35:04Z">
  <AudienceRestriction><Audience>http://localhost:5001</Audience></AudienceRestriction>
</Conditions>
```

`SubjectConfirmationData` が「持ってきた人を本人として扱ってよい条件」だったのに対し、`Conditions` は Assertion そのものが有効である条件です。条件を1つでも満たさない Assertion は無効です(Core 2.5.1 Element `<Conditions>`)。

このブログでは、次の2つの条件を書いています。

- `NotBefore` と `NotOnOrAfter`: いつからいつまで有効か
- `AudienceRestriction`: どの SP 向けの Assertion か

### NotBefore と NotOnOrAfter

```xml
<Conditions NotBefore="2026-11-02T02:30:04Z" NotOnOrAfter="2026-11-02T02:35:04Z">
```

| 属性 | 意味 |
| --- | --- |
| `NotBefore` | いつから Assertion が有効か |
| `NotOnOrAfter` | いつまで Assertion が有効か |

つまり、有効なのは次の範囲です。

```
NotBefore <= 今 < NotOnOrAfter
```

名前のとおり、`NotOnOrAfter` は「その時刻ちょうど、またはそれ以降は無効」という意味です。`NotAfter` ではないので、ちょうどその時刻になった時点で無効になります。  
また、`SubjectConfirmationData` の `NotOnOrAfter` は、`Conditions` の有効期間に収めるべき(SHOULD)とされています。
ただ、`Conditions` の期限が過ぎれば Assertion ごと無効になるので、必須ではありません(SP が両者の関係を検証する必要もありません)。

> ─ [SAML Core 2.0](https://docs.oasis-open.org/security/saml/v2.0/saml-core-2.0-os.pdf#page=19) 2.4.1.2 Element &lt;SubjectConfirmationData&gt;

### AudienceRestriction

```xml
<AudienceRestriction><Audience>http://localhost:5001</Audience></AudienceRestriction>
```

`Audience` には、この Assertion を受け取ってよい SP の entity ID を書きます。SP は、自分の entity ID が入っていなければ拒否します。ある SP 向けの Assertion を、別の SP に持ち込まれるのを防ぐためです。Web Browser SSO Profile では、SP の entity ID を入れた `AudienceRestriction` が必須です。

`Audience` は複数書けます。1つの `AudienceRestriction` の中では、どれか1つが自分の entity ID と一致すれば条件を満たします。`AudienceRestriction` が複数ある場合は、そのすべてを満たす必要があります。

> ─ [SAML Core 2.0](https://docs.oasis-open.org/security/saml/v2.0/saml-core-2.0-os.pdf#page=23) 2.5.1.4 Elements &lt;AudienceRestriction&gt; and &lt;Audience&gt;

`Recipient` と似ていますが、以下のような違いがあります。

| | 指すもの | 例 |
| --- | --- | --- |
| `Audience` | どの SP か(entity ID) | `http://localhost:5001` |
| `Recipient` | どの URL か(ACS) | `http://localhost:5001/acs` |

### ほかの条件

`Conditions` には、ほかにも次の条件を入れられます。このブログでは使っていません。

- `OneTimeUse`: 1 回しか使えない
- `ProxyRestriction`: この Assertion をもとに、別の Assertion を作ってよい範囲を制限する

> [!tip]
> それぞれの条件の詳細は Core 2.0 の 2.5.1.5 と 2.5.1.6 にあります。
> [SAML Core 2.0](https://docs.oasis-open.org/security/saml/v2.0/saml-core-2.0-os.pdf#page=24)

知らない条件が入っていると、SP はその条件を満たしているか判断できません。その場合、Assertion が有効かどうかは Indeterminate(判断できない)となります。このブログの SP は、判断できない Assertion は拒否するようにします。

> ─ [SAML Core 2.0](https://docs.oasis-open.org/security/saml/v2.0/saml-core-2.0-os.pdf#page=22) 2.5.1.1 General Processing Rules

`Conditions` も `build_assertion()` に足してみます。

```python
def build_assertion(idp_entity_id, acs_url, username, request_id, sp_entity_id):
  assertion_id = "_" + secrets.token_hex(20)
  now = datetime.now(timezone.utc)
  issued_at = format_dt(now)
  expires_at = format_dt(now + timedelta(minutes=5))

  return f'''
    <Assertion xmlns="{NS}" ID="{assertion_id}" Version="2.0" IssueInstant="{issued_at}">
      <Issuer>{idp_entity_id}</Issuer>
      <Subject>
        <NameID Format="urn:oasis:names:tc:SAML:1.1:nameid-format:unspecified">{username}</NameID>
        <SubjectConfirmation Method="urn:oasis:names:tc:SAML:2.0:cm:bearer">
          <SubjectConfirmationData Recipient="{acs_url}" NotOnOrAfter="{expires_at}" InResponseTo="{request_id}"/>
        </SubjectConfirmation>
      </Subject>
      <Conditions NotBefore="{issued_at}" NotOnOrAfter="{expires_at}">
        <AudienceRestriction><Audience>{sp_entity_id}</Audience></AudienceRestriction>
      </Conditions>
    </Assertion>
  '''
```

## AuthnStatement

「IdP がこのユーザーを、いつ、どの方法で本人確認したか」を表します。Web Browser SSO Profile では必須です([SAML Profiles 2.0](https://docs.oasis-open.org/security/saml/v2.0/saml-profiles-2.0-os.pdf#page=18) 4.1.4.2 &lt;Response&gt; Usage)。SAML でのログインは、この `AuthnStatement` があって初めて成り立ちます。

```xml
<AuthnStatement AuthnInstant="2026-11-02T02:30:04Z">
  <AuthnContext><AuthnContextClassRef>urn:oasis:names:tc:SAML:2.0:ac:classes:Password</AuthnContextClassRef></AuthnContext>
</AuthnStatement>
```

| 属性・要素 | 意味 |
| --- | --- |
| `AuthnInstant` | 本人確認した時刻 |
| `AuthnContext` | 本人確認の方法 |
| `SessionIndex` | IdP 側のログイン状態(セッション)を見分ける値 |
| `SessionNotOnOrAfter` | SP がログイン状態を終わらせるべき時刻 |

> ─ [SAML Core 2.0](https://docs.oasis-open.org/security/saml/v2.0/saml-core-2.0-os.pdf#page=26) 2.7.2 Element &lt;AuthnStatement&gt;

### AuthnInstant

`AuthnInstant` は、パスワードを入力するなどして本人確認をした時刻です。例では `IssueInstant` と同じ時刻になっています。このブログで作る IdP はログイン状態を覚えず、毎回パスワードを聞くためです。

本物の IdP は、一度ログインしたユーザーをしばらく覚えています。別の SP にログインしようとしたときは、パスワードを聞かずに Assertion だけを作ります(SSO)。このとき、`AuthnInstant` は最初にログインした時刻のまま、`IssueInstant` だけが新しくなります。

### AuthnContext

```xml
<AuthnContext><AuthnContextClassRef>urn:oasis:names:tc:SAML:2.0:ac:classes:Password</AuthnContextClassRef></AuthnContext>
```

`AuthnContextClassRef` に、本人確認の方法を URI で書きます。方法の一覧は、Authentication Context という別の仕様で定義されています。

| 末尾 | 意味 |
| --- | --- |
| `Password` | 暗号化されていない HTTP で、パスワードを使って認証した |
| `PasswordProtectedTransport` | HTTPS などの暗号化した通信で、パスワードを使って認証した |
| `X509` | 電子証明書で認証した |

> ─ [SAML Core 2.0](https://docs.oasis-open.org/security/saml/v2.0/saml-core-2.0-os.pdf#page=28) 2.7.2.2 Element &lt;AuthnContext&gt;  
> ─ [SAML Authentication Context 2.0](https://docs.oasis-open.org/security/saml/v2.0/saml-authn-context-2.0-os.pdf#page=22) 3.4 Schemas

`Password` を選んだのは、今回はローカルホストの(暗号化していない)HTTP で、パスワードを使って認証するからです。SP はこの値を見て、「この画面は多要素認証でないと開かせない」のように、認証の強さを判断できます。

### SessionIndex

`SessionIndex` は、ログアウトのときに使う値です。SAML には、IdP でログアウトすると SP 側のログイン状態もまとめて終わらせる仕組み(シングルログアウト)があり、そこで終わらせるログイン状態を見分けるために使います。シングルログアウトに対応する IdP では必須です。このブログではシングルログアウトに対応しないので、省いています。

> ─ [SAML Profiles 2.0](https://docs.oasis-open.org/security/saml/v2.0/saml-profiles-2.0-os.pdf#page=19) 4.1.4.2 &lt;Response&gt; Usage

`AuthnStatement` も `build_assertion()` に足してみます。

```python
def build_assertion(idp_entity_id, acs_url, username, request_id, sp_entity_id):
  assertion_id = "_" + secrets.token_hex(20)
  now = datetime.now(timezone.utc)
  issued_at = format_dt(now)
  expires_at = format_dt(now + timedelta(minutes=5))

  return f'''
    <Assertion xmlns="{NS}" ID="{assertion_id}" Version="2.0" IssueInstant="{issued_at}">
      <Issuer>{idp_entity_id}</Issuer>
      <Subject>
        <NameID Format="urn:oasis:names:tc:SAML:1.1:nameid-format:unspecified">{username}</NameID>
        <SubjectConfirmation Method="urn:oasis:names:tc:SAML:2.0:cm:bearer">
          <SubjectConfirmationData Recipient="{acs_url}" NotOnOrAfter="{expires_at}" InResponseTo="{request_id}"/>
        </SubjectConfirmation>
      </Subject>
      <Conditions NotBefore="{issued_at}" NotOnOrAfter="{expires_at}">
        <AudienceRestriction><Audience>{sp_entity_id}</Audience></AudienceRestriction>
      </Conditions>
      <AuthnStatement AuthnInstant="{issued_at}">
        <AuthnContext><AuthnContextClassRef>urn:oasis:names:tc:SAML:2.0:ac:classes:Password</AuthnContextClassRef></AuthnContext>
      </AuthnStatement>
    </Assertion>
  '''
```

## AttributeStatement

メールアドレスや所属などの、ユーザーの情報(属性)です。SP はこれを使って、アカウントを作ったり、権限を決めたりします。

```xml
<AttributeStatement><Attribute Name="mail" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:basic"><AttributeValue>famigb@example.com</AttributeValue></Attribute></AttributeStatement>
```

属性がないユーザーの場合は、`AttributeStatement` を出力しません。この要素には `Attribute` が1つ以上必要だからです。

> [!note]
> 属性はあるが値がない場合は、`AttributeValue` を省略して `Attribute` だけを出力します。`Attribute` が 1 つはあるので、`AttributeStatement` は省略しません。 [SAML Core 2.0](https://docs.oasis-open.org/security/saml/v2.0/saml-core-2.0-os.pdf#page=29) 2.7.3.1 Element &lt;Attribute&gt;

### Attribute

```xml
<Attribute Name="mail" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:basic">
  <AttributeValue>famigb@example.com</AttributeValue>
</Attribute>
```

| 属性・要素 | 意味 |
| --- | --- |
| `Name` | 属性の名前 |
| `NameFormat` | `Name` がどんな形式の名前か |
| `AttributeValue` | 属性の値 |

`NameFormat` の `basic` は、属性名が XML の名前として使える単純な文字列であることを表します。

> ─ [SAML Core 2.0](https://docs.oasis-open.org/security/saml/v2.0/saml-core-2.0-os.pdf#page=78) 8.2.3 Basic

`AttributeStatement` も `build_assertion()` に足してみます。属性がない場合は出力しません。

属性は `{"mail": "famigb@example.com", "displayName": "famigb"}` のような辞書で受け取り、1つずつ `Attribute` にします。

```python
def build_assertion(idp_entity_id, acs_url, username, request_id, sp_entity_id, attributes=None):
  assertion_id = "_" + secrets.token_hex(20)
  now = datetime.now(timezone.utc)
  issued_at = format_dt(now)
  expires_at = format_dt(now + timedelta(minutes=5))

  attribute_statement = ""
  if attributes:
    items = "".join(
      f'<Attribute Name="{name}" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:basic">'
      f"<AttributeValue>{value}</AttributeValue></Attribute>"
      for name, value in attributes.items()
    )
    attribute_statement = f"<AttributeStatement>{items}</AttributeStatement>"

  return f'''
    <Assertion xmlns="{NS}" ID="{assertion_id}" Version="2.0" IssueInstant="{issued_at}">
      <Issuer>{idp_entity_id}</Issuer>
      <Subject>
        <NameID Format="urn:oasis:names:tc:SAML:1.1:nameid-format:unspecified">{username}</NameID>
        <SubjectConfirmation Method="urn:oasis:names:tc:SAML:2.0:cm:bearer">
          <SubjectConfirmationData Recipient="{acs_url}" NotOnOrAfter="{expires_at}" InResponseTo="{request_id}"/>
        </SubjectConfirmation>
      </Subject>
      <Conditions NotBefore="{issued_at}" NotOnOrAfter="{expires_at}">
        <AudienceRestriction><Audience>{sp_entity_id}</Audience></AudienceRestriction>
      </Conditions>
      <AuthnStatement AuthnInstant="{issued_at}">
        <AuthnContext><AuthnContextClassRef>urn:oasis:names:tc:SAML:2.0:ac:classes:Password</AuthnContextClassRef></AuthnContext>
      </AuthnStatement>
      {attribute_statement}
    </Assertion>
  '''
```

## コード

だいぶ長々と制約を書いてきましたが、これで `build_assertion()` は完成です。
全体をまとめると次のとおりです。

```python
from datetime import datetime, timezone, timedelta
import secrets

# 名前空間
NS = "urn:oasis:names:tc:SAML:2.0:assertion"

def format_dt(dt):
  return dt.strftime("%Y-%m-%dT%H:%M:%SZ")

def build_assertion(idp_entity_id, acs_url, username, request_id, sp_entity_id, attributes=None):
  assertion_id = "_" + secrets.token_hex(20)
  now = datetime.now(timezone.utc)
  issued_at = format_dt(now)
  expires_at = format_dt(now + timedelta(minutes=5))

  attribute_statement = ""
  if attributes:
    items = "".join(
      f'<Attribute Name="{name}" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:basic">'
      f"<AttributeValue>{value}</AttributeValue></Attribute>"
      for name, value in attributes.items()
    )
    attribute_statement = f"<AttributeStatement>{items}</AttributeStatement>"

  return f'''
    <Assertion xmlns="{NS}" ID="{assertion_id}" Version="2.0" IssueInstant="{issued_at}">
      <Issuer>{idp_entity_id}</Issuer>
      <Subject>
        <NameID Format="urn:oasis:names:tc:SAML:1.1:nameid-format:unspecified">{username}</NameID>
        <SubjectConfirmation Method="urn:oasis:names:tc:SAML:2.0:cm:bearer">
          <SubjectConfirmationData Recipient="{acs_url}" NotOnOrAfter="{expires_at}" InResponseTo="{request_id}"/>
        </SubjectConfirmation>
      </Subject>
      <Conditions NotBefore="{issued_at}" NotOnOrAfter="{expires_at}">
        <AudienceRestriction><Audience>{sp_entity_id}</Audience></AudienceRestriction>
      </Conditions>
      <AuthnStatement AuthnInstant="{issued_at}">
        <AuthnContext><AuthnContextClassRef>urn:oasis:names:tc:SAML:2.0:ac:classes:Password</AuthnContextClassRef></AuthnContext>
      </AuthnStatement>
      {attribute_statement}
    </Assertion>
  '''
```

## 実際に動かしてみる

次の値を渡して、Assertion を生成してみます。

```python
idp_entity_id = 'http://localhost:5000'
acs_url = 'http://localhost:5001/acs'
username = 'famigb'
request_id = '_req1'
sp_entity_id = 'http://localhost:5001'
attributes = { "mail": "famigb@example.com" }
```

`fmt` は XML を整形するための自作関数です。

```python
>>> xml = build_assertion(idp_entity_id, acs_url, username, request_id, sp_entity_id, attributes)
>>> fmt(xml)
<?xml version="1.0"?>
<Assertion xmlns="urn:oasis:names:tc:SAML:2.0:assertion" ID="_40ecd8d838b8a3632c2c944c847fc2a12a18bb60" Version="2.0" IssueInstant="2026-11-03T06:11:53Z">
  <Issuer>http://localhost:5000</Issuer>
  <Subject>
    <NameID Format="urn:oasis:names:tc:SAML:1.1:nameid-format:unspecified">famigb</NameID>
    <SubjectConfirmation Method="urn:oasis:names:tc:SAML:2.0:cm:bearer">
      <SubjectConfirmationData Recipient="http://localhost:5001/acs" NotOnOrAfter="2026-11-03T06:16:53Z" InResponseTo="_req1"/>
    </SubjectConfirmation>
  </Subject>
  <Conditions NotBefore="2026-11-03T06:11:53Z" NotOnOrAfter="2026-11-03T06:16:53Z">
    <AudienceRestriction>
      <Audience>http://localhost:5001</Audience>
    </AudienceRestriction>
  </Conditions>
  <AuthnStatement AuthnInstant="2026-11-03T06:11:53Z">
    <AuthnContext>
      <AuthnContextClassRef>urn:oasis:names:tc:SAML:2.0:ac:classes:Password</AuthnContextClassRef>
    </AuthnContext>
  </AuthnStatement>
  <AttributeStatement>
    <Attribute Name="mail" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:basic">
      <AttributeValue>famigb@example.com</AttributeValue>
    </Attribute>
  </AttributeStatement>
</Assertion>
```

Assertion を生成できました！

## まとめ

正直、必要最低限のアサーションを生成するだけで一苦労でした。各要素にはまだいろいろなオプションを付けられるので、機能を追加するときに改めて調べようと思います。
とはいえ、Issuer が発行者、Subject が誰についての主張かとその確かめ方、Conditions が有効条件、AuthnStatement が本人確認の方法、AttributeStatement がユーザーの付加情報、という大まかな役割は理解できました。

かなり突貫工事で継ぎ足し継ぎ足し書いたので、あとで補足するかもしれませんが、署名なしのアサーションの作成はこれで終わりです。
次回は署名と検証をやります！
