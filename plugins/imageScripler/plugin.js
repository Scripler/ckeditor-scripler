CKEDITOR.plugins.add('imageScripler',
{
    icons: 'image',
    hidpi: true,
    init: function (editor) {
        var pluginName = 'imageScripler';
        editor.ui.addButton('imageScripler',
            {
                label: 'Image Scripler',
                command: 'OpenImageTab',
                icon: CKEDITOR.plugins.getPath('imageScripler') + 'icons/image.png'
            });
        var cmd = editor.addCommand('OpenImageTab', { exec: openImageTab });
    }
});
function openImageTab(e) {
    var parentScope = parent.angular.element(bodyeditor).parent().scope();
    parentScope.showInsert = true;
    parentScope.showDocuments = false; 
    parentScope.showTypo = false;
    parentScope.insertOptionChosen("showInsertImageOptions");
    parentScope.$apply();
}
