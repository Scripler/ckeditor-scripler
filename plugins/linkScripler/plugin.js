CKEDITOR.plugins.add('linkScripler',
{
    icons: 'link',
    hidpi: true,
    init: function (editor) {
        var pluginName = 'linkScripler';
        editor.ui.addButton('linkScripler',
            {
                label: 'Link Scripler',
                command: 'OpenlinkTab',
                icon: CKEDITOR.plugins.getPath('linkScripler') + 'icons/link.png'
            });
        var cmd = editor.addCommand('OpenlinkTab', { exec: openLinkTab });
    }
});
function openLinkTab(e) {
    var parentScope = parent.angular.element(bodyeditor).parent().scope();
    parentScope.showInsert = true;
    parentScope.showDocuments = false; 
    parentScope.showTypo = false;
    parentScope.insertOptionChosen("showInsertHyperlinkOptions");
    parentScope.$apply();
}
