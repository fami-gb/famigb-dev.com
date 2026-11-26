---
title: 2424013.xyz
date: 2025-12-31
description: このサイト。NieR:Automata の UI をモチーフにした、Astro 製のブログ兼ポートフォリオ。Vim のキー操作で歩き回れる。
stack: [Astro, TypeScript, Cloudflare Workers, Satori]
github: https://github.com/fami-gb/famigb-dev.com
demo: https://2424013.xyz
---

## 概要

いま見ているこのサイト。記録データ(ブログ)と制作ユニット(制作物)を置く場所として作った。
見た目は NieR:Automata のメニュー画面をモチーフにしている。

## 機能

- **キーボード操作**: `j` `k` で選択、`l` で決定、`h` で戻る、`/` で全文検索。Vim のつもりで歩き回れる
- **OGP 画像の自動生成**: Satori と resvg で、記事ごとのカード画像をビルド時に作る
- **Markdown 拡張**: KaTeX の数式、Mermaid の図、ファイル名つきコードブロック、OGP を読むリンクカード
- **コンテンツ管理**: ブログも制作物も `.md` を 1 つ足すだけでページになる

Cloudflare Workers の静的アセット配信で公開している。
