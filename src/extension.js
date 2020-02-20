const {languages, commands, workspace} = require('coc.nvim')

const EditProvider = require('./edit-provider')
const {supportedLanguageIds} = require('./language-map')

const langs = [
  ...supportedLanguageIds.map(language => ({scheme: 'file', language})),
  ...supportedLanguageIds.map(language => ({scheme: 'untitled', language}))
]

exports.activate = function (context) {
  const editProvider = new EditProvider()
  context.subscriptions.push(
    languages.registerDocumentRangeFormattingEditProvider(langs, editProvider)
  )
  context.subscriptions.push(
    languages.registerDocumentFormattingEditProvider(langs, editProvider)
  )

  context.subscriptions.push(
    commands.registerCommand('prettier-standard.formatFile', async () => {
      let document = await workspace.document
      let prettierConfig = workspace.getConfiguration('prettier', document.uri)
      let onlyUseLocalVersion = prettierConfig.get(
        'onlyUseLocalVersion',
        false
      )
      if (
        onlyUseLocalVersion &&
        (!hasLocalPrettierInstalled(Uri.parse(document.uri).fsPath) ||
          document.schema != 'file')
      ) {
        workspace.showMessage(
          `Flag prettier.onlyUseLocalVersion is set, but prettier is not installed locally. No operation will be made.`,
          'warning'
        )
        return
      }
      let edits = await format(
        document.content,
        document.textDocument,
        {}
      ).then(code => [
        TextEdit.replace(fullDocumentRange(document.textDocument), code),
      ])
      if (edits && edits.length) {
        await document.applyEdits(workspace.nvim, edits)
      }
    })
  )
}

exports.deactivate = function () {}
