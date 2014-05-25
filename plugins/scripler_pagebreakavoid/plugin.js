'use strict';

( function() {
	// Register a plugin named "pagebreak".
	CKEDITOR.plugins.add( 'scripler_pagebreakavoid', {
		lang: 'da,en',
		hidpi: true,

		onLoad: function() {
			var cssStyles = (
					'border-right:2px solid #4198d9;'
				).replace( /;/g, ' !important;' ); // Increase specificity to override other styles, e.g. block outline.

			// Add the style that renders our placeholder.
			CKEDITOR.addCss( 'div.cke_pagebreakavoid{' + cssStyles + '}' );
			CKEDITOR.addCss( 'p.cke_pagebreakavoid{' + cssStyles + '}' );
		},

		init: function( editor ) {
			if ( editor.blockless )
				return;

			// Register the command.
			editor.addCommand( 'pagebreakavoid', CKEDITOR.plugins.pagebreakavoidCmd );

			// Webkit based browsers needs help to select the page-break.
			CKEDITOR.env.webkit && editor.on( 'contentDom', function() {
				editor.document.on( 'click', function( evt ) {
					var target = evt.data.getTarget();
					if ( target.is( 'div' ) && target.hasClass( 'cke_pagebreakavoid' ) )
						editor.getSelection().selectElement( target );
				} );
			} );
		}/*,

		afterInit: function( editor ) {
			// Register a filter to displaying placeholders after mode change.
			var dataProcessor = editor.dataProcessor,
				dataFilter = dataProcessor && dataProcessor.dataFilter,
				htmlFilter = dataProcessor && dataProcessor.htmlFilter,
				styleRegex = /page-break-after\s*:\s*always/i,
				childStyleRegex = /display\s*:\s*none/i;

			function upcastPageBreak( element ) {
				CKEDITOR.tools.extend( element.attributes, attributesSet( editor.lang.pagebreak.alt ), true );

				element.children.length = 0;
			}

			if ( htmlFilter ) {
				htmlFilter.addRules( {
					attributes: {
						'class': function( value, element ) {
							var className = value.replace( 'cke_pagebreakavoid', '' );
							if ( className != value ) {
								var span = CKEDITOR.htmlParser.fragment.fromHtml( '<span style="display: none;">&nbsp;</span>' ).children[ 0 ];
								element.children.length = 0;
								element.add( span );
								var attrs = element.attributes;
								delete attrs[ 'aria-label' ];
								delete attrs.contenteditable;
								delete attrs.title;
							}
							return className;
						}
					}
				}, { applyToAll: true, priority: 5 } );
			}

			if ( dataFilter ) {
				dataFilter.addRules( {
					elements: {
						div: function( element ) {
							// The "internal form" of a pagebreak is pasted from clipboard.
							// ACF may have distorted the HTML because "internal form" is
							// different than "data form". Make sure that element remains valid
							// by re-upcasting it (#11133).
							if ( element.attributes[ 'data-cke-pagebreak' ] )
								upcastPageBreak( element );

							// Check for "data form" of the pagebreak. If both element and
							// descendants match, convert them to internal form.
							else if ( styleRegex.test( element.attributes.style ) ) {
								var child = element.children[ 0 ];

								if ( child && child.name == 'span' && childStyleRegex.test( child.attributes.style ) )
									upcastPageBreak( element );
							}
						}
					}
				} );
			}
		}*/
	});

	// TODO Much probably there's no need to expose this object as public object.
	CKEDITOR.plugins.pagebreakavoidCmd = {
		exec: function( editor ) {

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
					block.$.style.borderRight = "2px solid #4198d9";
				}
			}
		}
	};
} )();