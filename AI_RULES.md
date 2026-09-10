# AI EDITING RULES — STRICT

## 🚨 CRITICAL

This project contains production website code.

AI coding agents MUST NOT modify files unless the user explicitly requests those specific files to be modified.

### NEVER DO THESE THINGS

* Do not rewrite the entire project.
* Do not refactor existing code unless explicitly requested.
* Do not regenerate product files.
* Do not modify unrelated products.
* Do not change product names, prices, images, descriptions, SKUs, or inventory unless explicitly requested.
* Do not modify CSS unless explicitly requested.
* Do not modify JavaScript unless explicitly requested.
* Do not modify HTML unless explicitly requested.
* Do not modify configuration files unless explicitly requested.
* Do not rename files.
* Do not delete files.
* Do not create duplicate product files.
* Do not change Git configuration.
* Do not run `git push`.
* Do not commit changes automatically.
* Do not install packages or dependencies unless explicitly requested.

## PRODUCT DATA PROTECTION

Product information is sensitive.

When changing a product:

1. Find the exact SKU.
2. Modify ONLY the requested field(s).
3. Preserve every other field exactly.
4. Do not reorder products.
5. Do not renumber SKUs.
6. Do not regenerate the product database.
7. Do not modify other SKUs.

## BEFORE EDITING

First determine:

* Which exact file needs modification.
* Which exact lines/entries need modification.
* What other files, if any, must be changed.

If the requested change can be completed by editing one file, edit ONLY that file.

If you are unsure which file should be changed, STOP and ask the user.

## AFTER EDITING

Verify:

* Only requested files changed.
* Only requested products changed.
* No unrelated files were modified.
* No unrelated product data changed.
* No files were deleted.
* No files were renamed.

## GIT SAFETY

AI agents must NEVER:

* `git push`
* `git commit`
* `git reset --hard`
* `git clean`
* force push
* delete branches

The user must manually review all changes before committing or pushing.

## PRINCIPLE

Make the smallest possible change.

This is a surgical editing task, NOT a refactoring task.

If the requested change requires touching unrelated code, STOP and ask the user first.
