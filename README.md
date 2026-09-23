# 薬剤学習アプリ

総合内科・精神科を中心とした薬剤カタログ学習用 Web アプリです。

## スマホから見る（公開URL）

**https://hira13kaz13-ctrl.github.io/yakuzai-gakushu/**

Safari / Chrome で開いてください。ホーム画面に追加するとアプリ風に使えます。

データや機能を更新したあと、このリポジトリに push すると自動で再公開されます。

## ローカル起動

Node.js 22+ が必要です（ポータブル版可）。

```powershell
$env:Path = "$env:LOCALAPPDATA\nodejs-portable\node-v22.14.0-win-x64;" + $env:Path
cd c:\Cursor\薬剤学習アプリ
npm install
npm run dev
```

ブラウザで http://localhost:5173 を開きます。同一 Wi‑Fi のスマホからは、ターミナルに表示される Network の URL でも開けます。

データ更新は `c:\Cursor\薬剤Cursor` で:

```bash
python build_xlsx.py
```

`public/data/drugs.json` と `public/data/treatments.json` が同時に書き出されます
（Excel が開いていて保存できない場合でも JSON は更新されます）。

## モード

| モード | 状態 |
|---|---|
| 薬剤図鑑 | 実装済 |
| 薬剤名クイズ | 実装済 |
| 一般名・商品名 神経衰弱 | 実装済 |
| 治療選択（治療方針） | 実装済 |
| 治療選択（薬剤選択） | 実装済 |
| 薬価 High / Low | 実装済 |
