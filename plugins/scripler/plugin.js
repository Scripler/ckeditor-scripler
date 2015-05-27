CKEDITOR.plugins.add( 'scripler', {
	init: function( editor ) {
		function isEmpty( node ) {
			var trimmed;
			if (node.getData) {
				trimmed = node.getData();
			} else {
				trimmed = node.getText();
			}
			trimmed = CKEDITOR.tools.ltrim(trimmed);
			if (trimmed && trimmed.length > 0) {
				//Paragraph contains some text, so not empty
				return false;
			}

			//Didn't identify any content, so should be empty
			return true;
		}

		function checkBlock(block) {
			if (block && block.is('p')) {
				if (isEmpty(block)) {
					block.addClass('empty-paragraph');
				} else {
					block.removeClass('empty-paragraph');
				}
			}
		}

		var changed = function () {
			if (editor.elementPath() && editor.elementPath().block) {
				// Check the block where the users cursor is currently located.
				checkBlock(editor.elementPath().block);
				// Check the previous block (maybe we just left it empty, while auto paragraphing to the next block)
				checkBlock(editor.elementPath().block.getPrevious());
			}
		};

		// For any content check, check for empty paragraph.
		editor.on('change', changed);
		// Make sure that we identify an empty paragraph after auto-paragraphing.
		editor.on('selectionChange', changed);
		editor.on('elementsPathUpdate', changed);

		var toolbarObj;

		editor.on('paste', function (ev) {
			//Identify empty paragraphs in pasted data
			if (ev.data.dataValue) {
				ev.data.dataValue = ev.data.dataValue.replace(/(<p)(?![^>]*empty-paragraph)([^>]*?)(class\s*=\s*["']([^"']*)["']([^>]*))?(>(\s|&nbsp;)*<\/p>)/g, '$1$2 class="$4 empty-paragraph"$5$6');
			}
		});

		editor.on('instanceReady', function (event){
			var editorId = editor.id;
			var editorTop = document.getElementById( editorId+'_top' );
			toolbarObj = document.getElementById( editorId+'_toolbox' );
			editorTop.style.textAlign = 'center';

			toolbarObj.style.display = 'inline-block';
			toolbarObj.style.background = '#D6D6D6';
			toolbarObj.style.padding = '3px 0 0 7px';
		});
	}
});
