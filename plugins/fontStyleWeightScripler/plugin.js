/**
 * @license Copyright (c) 2003-2014, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or http://ckeditor.com/license
 */

( function() {
	function addCombo( editor, comboName, styleType, lang, entries, defaultLabel, styleDefinition, order ) {
		var config = editor.config,
			style = new CKEDITOR.style( styleDefinition );

		// Gets the list from settings
		var names = entries.split( ';' ),
			values = [];

		// Create style objects
		var styles = {};
		for ( var i = 0; i < names.length; i++ ) {
			var parts = names[ i ];

			if ( parts ) {
				parts = parts.split( '/' );

				var vars = {},
					name = names[ i ] = parts[ 0 ];

				vars[ styleType ] = values[ i ] = parts[ 1 ] || name;
				vars[ 'style' ] = parts[ 2 ];

				styles[ parts[ 1 ] ] = new CKEDITOR.style( styleDefinition, vars );
				styles[ parts[ 1 ] ]._.definition.name = name;
			} else {
				names.splice( i--, 1 );
			}
		}

		editor.ui.addRichCombo( comboName, {
			label: lang.label,
			title: lang.panelTitle,
			toolbar: 'styles,' + order,
			allowedContent: style,
			requiredContent: style,

			panel: {
				css: [ CKEDITOR.skin.getPath( 'editor' ) ].concat( config.contentsCss ),
				multiSelect: false,
				attributes: { 'aria-label': lang.panelTitle }
			},

			init: function() {
				this.startGroup( lang.panelTitle );

				for ( var i = 0; i < names.length; i++ ) {
					var name = names[ i ];

					// Add the tag entry to the panel list.
					this.add( name, styles[ name ].buildPreview(), name );
				}
			},

			onClick: function( value ) {
				editor.focus();
				editor.fire( 'saveSnapshot' );

				var style = styles[ value ];

				editor[ this.getValue() == value ? 'removeStyle' : 'applyStyle' ]( style );
				this.setStyle( 'font-weight', style._.definition.styles['font-weight'] );
				this.setStyle( 'font-style', style._.definition.styles['font-style'] );
				editor.fire( 'saveSnapshot' );
			},

			onRender: function() {
				editor.on( 'selectionChange', function( ev ) {
					var currentValue = this.getValue();

					var elementPath = ev.data.path,
						elements = elementPath.elements;

					// For each element into the elements path.
					for ( var i = 0, element; i < elements.length; i++ ) {
						element = elements[ i ];
						
						var fontWeight = element.getComputedStyle('font-weight');
						var fontStyle = element.getComputedStyle('font-style');
						var isNormalWeight = false;
						var isNormalStyle = false;
						var fontWeightValue = null;
						var fontStyleValue = null;

						// Check if the element is removable by any of
						// the styles.
						//console.log('styles: ' + JSON.stringify(styles));
						for ( var value in styles ) {
							if ( styles[ value ].checkElementMatch( element, true, editor ) ) {
								if ( value != currentValue ) {
									this.setValue( value );
									this.setStyle( 'font-weight', styles[ value ]._.definition.styles['font-weight'] );
									this.setStyle( 'font-style', styles[ value ]._.definition.styles['font-style'] );
								}
								return;
							} else {
								var combined = fontWeight + ' ' + fontStyle;
								
								if ( combined === value ) {
									if ( value != currentValue ) {
										this.setValue( value ); 
										this.setStyle( 'font-weight', styles[ value ]._.definition.styles['font-weight'] );
										this.setStyle( 'font-style', styles[ value ]._.definition.styles['font-style'] );
									}
									return;
								} 
								else if ( fontWeight === value ) {
									fontWeightValue = value;
									if ( fontWeight === 'normal' ) {
										isNormalWeight = true;
									}
								} else if ( fontStyle === value ) {
									if ( fontStyle === 'normal' ) {
										isNormalStyle = true;
									}
								}
							}
						}

						if ( isNormalWeight && !isNormalStyle ) {
							if ( fontStyle != currentValue ) {
								this.setValue( fontStyle ); 
								this.setStyle( 'font-weight', styles[ fontStyle ]._.definition.styles['font-weight'] ); // TODO: should this be styles[ fontWeight ]...?
								this.setStyle( 'font-style', styles[ fontStyle ]._.definition.styles['font-style'] );
							} 
							return;
						}

						if ( isNormalStyle && !isNormalWeight ) {
							if ( fontWeight != currentValue ) {
								this.setValue( fontWeight ); 
								this.setStyle( 'font-weight', styles[ fontWeight ]._.definition.styles['font-weight'] );
								this.setStyle( 'font-style', styles[ fontWeight ]._.definition.styles['font-style'] ); // TODO: should this be styles[ fontStyle ]...?
							} 
							return;
						}
					}

					// If no styles match, just empty it.
					this.setValue( '', defaultLabel );
				}, this );
			},

			onOpen: function() {
				this.showAll();
				
				var enabledStyles = CKEDITOR.config.fontStyleWeight_enabledStyles;

				//if fontSelected is undefined it will just show all options
				//this happens when editor is first loaded 
				//font is not set until cursor is set by user or user selects a font from font dropdown
				var scope = parent.angular.element(bodyeditor).scope();
				if ( typeof scope.fontSelected !== 'undefined' ) {
					for ( var p = 0; p < enabledStyles.length; p++ ) {
					
						if ( enabledStyles[p].fontName === scope.fontSelected ) {
							var fontStyles = enabledStyles[p].styles;					
							for ( var name in styles ) {
								var hideStyle = true;
							
								for ( var x = 0; x < fontStyles.length; x++ ) {
									if ( name === fontStyles[x] ) {
										hideStyle = false;
										//style is enabled break
										break;
									}
								}

								if ( hideStyle ) {
									this.hideItem( name );
								}
							}	
							//font found break
							break;
						}

					}
				}
			},

			refresh: function() {
				if ( !editor.activeFilter.check( style ) )
					this.setState( CKEDITOR.TRISTATE_DISABLED );
			}
		} );
	}

	CKEDITOR.plugins.add( 'fontStyleWeightScripler', {
		requires: 'richcombo',
		init: function( editor ) {
			var config = editor.config;

			var langStrings = {
				title: 'Style Weight',
				label: 'Style Weight',
				voiceLabel: 'Style Weight',
				panelTitle: 'Style Weight'
			};

			addCombo( editor, 'FontStyleWeight', 'weight', langStrings, config.fontStyleWeight_combinations, config.fontStyleWeight_defaultLabel, config.fontStyleWeight_style, 50 );
		}
	} );
} )();


/*Weight is given like this:
100 = thin
200 = extra-light
300 = light
400 = normal, book
500 = medium
600 = demi-bold
700 = bold
800 = heavy
900 = black

font style:
normal
italic

meanings:
displayed name/weight/font style

examples:
normal/400/normal
italic/400/italic
bold italic/700/italic
black/900/normal

*/

CKEDITOR.config.fontStyleWeight_combinations = 'thin/100/normal;thin italic/100/italic;extra-light/200/normal;extra-light italic/200/italic;light/300/normal;light italic/300/italic;normal/400/normal;italic/400/italic;demi-bold/600/normal;demi-bold italic/600/italic;bold/700/normal;bold italic/700/italic;heavy/800/normal;heavy italic/800/italic;black/900/normal;black italic/900/italic;';

/* font allowed styles
	array containing font names and an array of styles by displayed name 
	(because CK creates styles by name and it's easier to match by name than by 2x CSS properties)
 */
CKEDITOR.config.fontStyleWeight_enabledStyles = [
	{ fontName: 'Aleo', styles: ['light', 'light italic', 'normal', 'italic', 'bold', 'bold italic'] },
	{ fontName: 'Arsenal', styles: ['normal', 'italic', 'bold', 'bold italic'] },
	{ fontName: 'Autour One', styles: ['normal'] },
	{ fontName: 'Bob', styles: ['light', 'bold'] },
	{ fontName: 'Charis', styles: ['normal', 'italic', 'bold', 'bold italic'] },
	{ fontName: 'Chunk', styles: ['bold'] },
	{ fontName: 'CMU Bright', styles: ['normal', 'italic', 'demi-bold', 'demi-bold italic', 'bold', 'bold italic' ] },
	{ fontName: 'CMU Concrete', styles: ['normal', 'italic', 'bold', 'bold italic'] },
	{ fontName: 'CMU Sans Serif', styles: ['normal', 'italic', 'bold', 'bold italic'] },
	{ fontName: 'CMU Serif', styles: ['normal', 'italic', 'bold', 'bold italic'] },
	{ fontName: 'CMU Typewriter', styles: ['light', 'light italic', 'normal', 'italic', 'bold', 'bold italic'] },
	{ fontName: 'Courier Prime', styles: ['normal', 'italic', 'bold', 'bold italic'] },
	{ fontName: 'Crimson', styles: ['normal', 'italic', 'demi-bold', 'demi-bold italic', 'bold', 'bold italic'] },
	{ fontName: 'Deja Vu Sans', styles: ['extra-light', 'normal', 'italic', 'bold', 'bold italic'] },
	{ fontName: 'Deja Vu Sans Condensed', styles: ['normal', 'italic', 'bold', 'bold italic'] },
	{ fontName: 'Deja Vu Mono', styles: ['normal', 'italic', 'bold', 'bold italic'] },
	{ fontName: 'Deja Vu Serif', styles: ['normal', 'italic', 'bold', 'bold italic'] },
	{ fontName: 'Deja Vu Serif Condensed', styles: ['normal', 'italic', 'bold', 'bold italic'] },
	{ fontName: 'Gabriela', styles: ['normal'] },
	{ fontName: 'Junicode', styles: ['normal', 'italic', 'bold', 'bold italic'] },
	{ fontName: 'Kelson', styles: ['light', 'normal', 'bold'] },
	{ fontName: 'Kreon', styles: ['light', 'normal', 'bold'] },
	{ fontName: 'League Gothic', styles: ['normal', 'italic'] },
	{ fontName: 'Linux Biolinum', styles: ['normal', 'italic', 'bold'] },
	{ fontName: 'Merriweather', styles: ['light', 'normal', 'bold', 'heavy'] },
	{ fontName: 'Nobile', styles: ['normal', 'italic', 'bold', 'bold italic'] },
	{ fontName: 'Open Sans', styles: ['light', 'light italic', 'normal', 'italic', 'demi-bold', 'demi-bold italic', 'bold', 'bold italic', 'heavy', 'heavy italic'] },
	{ fontName: 'Prime', styles: ['light', 'normal'] },
	{ fontName: 'Quicksand', styles: ['extra-light', 'light', 'light italic', 'normal', 'italic', 'bold', 'bold italic'] },
	{ fontName: 'Raleway', styles: ['thin'] },
	{ fontName: 'Rambla', styles: ['normal', 'italic', 'bold', 'bold italic'] },
	{ fontName: 'Roboto', styles: ['thin', 'thin italic', 'light', 'light italic', 'normal', 'italic', 'demi-bold', 'demi-bold italic', 'bold', 'bold italic', 'black', 'black italic'] },
	{ fontName: 'Roboto Condensed', styles: ['normal', 'italic', 'bold', 'bold italic'] },
	{ fontName: 'Signika', styles: ['light', 'normal', 'demi-bold', 'bold'] },
	{ fontName: 'Source Code Pro', styles: ['extra-light', 'light', 'normal', 'demi-bold', 'bold', 'black'] },
	{ fontName: 'Source Sans Pro', styles: ['extra-light', 'extra-light italic', 'light', 'light italic', 'normal', 'italic', 'demi-bold', 'demi-bold italic', 'bold', 'bold italic', 'black', 'black italic'] },
	{ fontName: 'Ubuntu', styles: ['light', 'light italic', 'normal', 'italic', 'demi-bold', 'demi-bold italic', 'bold', 'bold italic'] },
	{ fontName: 'Ubuntu Mono', styles: ['normal', 'italic', 'bold', 'bold italic'] },
	{ fontName: 'Vidaloka', styles: ['normal'] },
	{ fontName: 'Voltaire', styles: ['normal'] }
];

CKEDITOR.config.fontStyleWeight_defaultLabel = '';

CKEDITOR.config.fontStyleWeight_style = {
	element: 'span',
	styles: { 	'font-weight': '#(weight)',
		  	 	'font-style' : '#(style)' },
	overrides: [ {
		element: 'font', attributes: { 'weight': null, 'style': null }
	} ]
};

