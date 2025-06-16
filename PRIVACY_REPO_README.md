# ネコノテ プライバシーポリシー リポジトリ

このリポジトリは、Chrome 拡張機能 **「ネコノテ」** の公式プライバシーポリシーをホストするためだけのシングルパーパス・リポジトリです。

## 構成

| ファイル | 説明 |
| -------- | ---- |
| `PRIVACY.md` | Markdown 版プライバシーポリシー（編集はこちら） |
| `privacy.html` | Chrome Web Store に提出するための HTML 版プライバシーポリシー（GitHub Pages でホスト可能） |

## 公開方法

1. **GitHub Pages を有効化**  
   - Repository → Settings → Pages → Source で `main` ブランチの `/(root)` を選択し保存。<br>
   - 数分後 `https://<username>.github.io/<repo>/privacy.html` でアクセス可能になります。
2. Chrome Web Store の「プライバシーポリシー URL」に GitHub Pages の URL を入力します。

## 編集フロー

1. `PRIVACY.md` を編集します（Markdown 形式）。
2. 変更をコミット & プッシュすると、GitHub Actions などを使わなくても GitHub が自動的に HTML ページを再生成します（`privacy.html` を手動で更新する場合はビルドスクリプト等をご用意ください）。
3. 必要に応じて `最終更新日` を更新してください。

## 連絡先

ご質問がある場合は下記までお問い合わせください。

- Email: [einar.tokyo@gmail.com](mailto:einar.tokyo@gmail.com)

## ライセンス

プライバシーポリシー本文は著作権で保護されていますが、ネコノテ利用者・レビュー担当者が参照する目的に限り再配布を許可します。コード片およびスタイルは MIT ライセンスで提供します。 