---
title: EDTCHP v2
date: 2026-09-30
description: サークル EDTC の公式サイト。Astro の静的サイトを Cloudflare Workers で配信し、ブログは管理ツールからの PR で公開する。
stack: [Astro, TypeScript, Cloudflare Workers]
image: /works/edtchp-v2.webp
github: https://github.com/KAIT-EDTC/EDTCHP_v2
demo: https://kaitedtc.com
---

## 概要

神奈川工科大学 EDTC の公式サイトを作り直したもの。
活動紹介、制作物、ブログ、問い合わせのページを持つ静的サイトで、Cloudflare Workers の静的アセット配信で公開している。

## 仕組み

- **ブログは PR で届く**: メンバーは [EDTC Dashboard](/works/edtc-dashboard/) で記事を書いて提出するだけ。Markdown と画像のセットがこのリポジトリに PR として作られ、CI とレビューを通ってマージされると公開される
- **カテゴリ**: 遊行塾・学外イベント・学内イベント・レクの 4 つ。ピックアップ指定でトップに載せられる
- **プレビュー**: Workers Builds で PR ごとにプレビュー URL が出るので、開発メンバー以外にもそのまま見せられる
- **品質**: `astro check` による型とコンテンツの検査、`node --test` のテストをビルドに含めている。sitemap も自動生成

書き手が Git を知らなくても、公開までの流れはすべて Git と CI の上に乗っている。そこが一番の設計ポイント。
