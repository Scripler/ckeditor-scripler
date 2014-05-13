CKEDITOR.plugins.add( 'line-height', {
    requires: ['richcombo'],
    init: function( editor ) {
        var config = editor.config,
            lang = editor.lang.format;
        var trackings = [];

        for (var i = 1; i < 5; i=i+0.1) {
          i = Math.round(i * 100) / 100;
          trackings.push(String(i));
        }

        editor.ui.addRichCombo('line-height', {
          label: 'Line-Height',
          //title: 'Change line-height',
          voiceLabel: 'Change line-height',
          className: 'cke_format',
          multiSelect: false,

          panel: {
            css : [ config.contentsCss, CKEDITOR.getUrl( CKEDITOR.skin.getPath + 'editor.css' ) ],
            voiceLabel : lang.panelVoiceLabel
          },

          init: function() {
            //this.startGroup('line-height');
            for (var this_letting in trackings) {
              this.add(trackings[this_letting], trackings[this_letting], trackings[this_letting]);
            }
          },

          onClick: function(value) {
            editor.focus();
            editor.fire('saveSnapshot');

			var selection = editor.getSelection(),
			range = selection && selection.getRanges()[ 0 ],
			nearestListBlock;

			if ( !selection ) {
				return;
			}

			var iterator = range.createIterator(),
			enterMode = editor.config.enterMode,
			block;

			iterator.enforceRealBlocks = true;
			iterator.enlargeBr = enterMode != CKEDITOR.ENTER_BR;

			while ( ( block = iterator.getNextParagraph( enterMode == CKEDITOR.ENTER_P ? 'p' : 'div' ) ) ) {
				if ( !block.isReadOnly() ) {
					block.$.style.lineHeight = value;
				}
			}

            editor.fire('saveSnapshot');
          }
        });
    }
});