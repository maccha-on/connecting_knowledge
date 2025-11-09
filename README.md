This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```


## Directory structure 
    my-demo-app/
    ├─ app/
    │  ├─ api/
    │  │  ├─ upload/route.ts      # Flow A: ファイルアップロード＋AI解析（保存はまだ）
    │  │  ├─ save/route.ts        # Flow A: ユーザー編集後の保存（data.jsonへ）
    │  │  └─ chat/route.ts        # Flow B: 問い合わせ→data.json検索
    │  ├─ globals.css
    │  └─ page.tsx                 # チャットUI（中央ログ＋下部入力＆添付）
    ├─ components/
    │  └─ Chat.tsx                 # UI本体
    ├─ lib/
    │  ├─ search.ts                # 簡易検索（スコアリング）
    │  └─ store.ts                 # data.json 読み書きユーティリティ
    ├─ public/
    │  └─ uploads/                 # アップロード先（デモ用）
    ├─ data/
    │  └─ data.json                # 初期は []
    ├─ .env.local                  # OPENAI_API_KEY=...
    ├─ package.json
    ├─ next.config.mjs
    ├─ postcss.config.mjs
    ├─ tailwind.config.mjs
    └─ tsconfig.json


Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.


