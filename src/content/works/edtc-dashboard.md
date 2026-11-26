---
title: EDTC Dashboard
date: 2026-05-15
description: サークル EDTC のメンバー専用管理ツール。イベント・出欠・シフト・活動報告書・ブログ投稿を一つの Worker にまとめた。
stack: [TypeScript, Hono, React Router, Zod, Drizzle, Cloudflare Workers, D1, R2, Panda CSS]
github: https://github.com/KAIT-EDTC/dashboard
---

## 概要

神奈川工科大学のものづくりサークル EDTC で使っている、メンバー専用の管理ツール。
イベントの段取り、出欠、報告書の提出と承認、公式サイトへのブログ投稿を一か所に集めた。
ログインは Discord OAuth2 で、EDTC の Discord サーバーに所属していれば誰でも入れる。

立ち上げから開発し、コミットの約 8 割を担当している。

## 機能

- **イベント管理**: 作成・出欠回答・持ち物・集金・講師の指定。種類ごとの設定は管理者メニューから変更できる
- **シフト**: 文化祭などで誰がどの時間に出るかを組む
- **活動報告書**: 提出から承認まで。まとめ報告書は活動写真ごと Excel の書式に書き出す
- **ブログ投稿**: 書いて提出すると、GitHub App が [EDTCHP v2](/works/edtchp-v2/) に Markdown と画像の PR を作る。レビュー状態は Webhook で受け取る
- **通知**: Discord Bot でイベントやブログの動きを知らせる
- **添付ファイル**: R2 に保存し、無料枠に収まるよう総容量に上限を設け、2 年経ったファイルは毎日の Cron で消す
- **PWA**: ホーム画面に追加してアプリのように使える

## 構成

```
client (React Router SPA) ──┐
                            ├── 1 つの Worker が静的ファイルと /api/* を同じオリジンで配信
server (Hono) ──────────────┘
   ├── D1 (Drizzle)
   ├── R2 (添付・写真)
   └── Cron Trigger
shared  … Zod スキーマと型を client / server で共有
```

- Hono RPC と Zod で、API の型をクライアントまでそのまま通す
- PR ごとにプレビュー用の Worker と D1 を自動で作り、ダミーユーザーでログインして確認できる
- main への push で本番へ自動デプロイ。pre-commit で secretlint を走らせ、秘密情報の混入を防ぐ
