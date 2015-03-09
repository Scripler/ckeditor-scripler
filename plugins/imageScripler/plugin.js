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
                icon: CKEDITOR.skin.path() + 'icons/image.png'
            });
        var cmd = editor.addCommand('OpenImageTab', { exec: openImageTab });
    }
});
function openImageTab(e) {
    var parentScope = parent.angular.element(bodyeditor).parent().scope();
    parentScope.showLeftMenu('insert', true);
    parentScope.insertOptionChosen('showInsertImageOptions');
    parentScope.$apply();
}
