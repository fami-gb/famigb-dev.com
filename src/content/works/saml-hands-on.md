---
title: saml-hands-on
date: 2026-10-26
description: SAML の IdP と SP を、SAML ライブラリを使わずに Python で自作した学習用リポジトリ。15 種の攻撃がすべて拒否されることを確かめる。
stack: [Python, Flask, cryptography, SAML, XMLDSig]
image: https://opengraph.githubassets.com/1/fami-gb/saml-hands-on
github: https://github.com/fami-gb/saml-hands-on
---

## 概要

SSO で使われる SAML を、仕組みから理解するために IdP と SP をゼロから実装したもの。
ブログ連載「[CSの基礎すらままならないけど、SAMLを理解してみる](/blog/saml_impl_0/)」のコード。

> 学習用。XMLDSig は簡略版で、本番での利用は想定していない。

## 内容

| ファイル | 役割 |
| --- | --- |
| `saml_lib.py` | Assertion の生成・署名・検証 |
| `idp.py` / `sp.py` | Flask で動く IdP(5000)と SP(5001) |
| `check.py` | ステップごとの動作確認 |
| `test_attacks.py` | 攻撃がすべて拒否されることの確認 |

`start` タグは関数がすべて `NotImplementedError` の穴埋め版。`check.py` が最初に失敗した場所が次に書く場所になるので、読者が自分の手で順に埋めていける。

## 攻撃テスト

NameID や属性の書き換え、署名の削除、攻撃者の鍵での署名、期限切れ、別 SP・別 ACS 宛て、リプレイ、信頼しない Issuer、署名ラッピング 2 種など 15 パターンを用意。
`verify_response` のチェックを 1 つ外すと、対応する攻撃だけが通ってしまうことを確かめられる。
