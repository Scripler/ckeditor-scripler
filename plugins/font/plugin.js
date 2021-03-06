/**
 * @license Copyright (c) 2003-2014, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or http://ckeditor.com/license
 */

( function() {
	function addCombo( editor, comboName, styleType, lang, entries, defaultLabel, styleDefinition, order ) {
		var config = editor.config,
			style = new CKEDITOR.style( styleDefinition );

		// Gets the list of fonts from the settings.
		var names = entries.split( ';' ),
			values = [];

		// Create style objects for all fonts.
		var styles = {};
		for ( var i = 0; i < names.length; i++ ) {
			var parts = names[ i ];

			if ( parts ) {
				parts = parts.split( '/' );

				var vars = {},
					name = names[ i ] = parts[ 0 ];

				vars[ styleType ] = values[ i ] = parts[ 1 ] || name;

				styles[ name ] = new CKEDITOR.style( styleDefinition, vars );
				styles[ name ]._.definition.name = name;
			} else
				names.splice( i--, 1 );
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
					if ( typeof styles[ name ]._.definition.styles['font-size'] !== 'undefined' ) {
						var html = styles[ name ].buildPreview();
						var newHtml = html.replace(/(<[^>]+) style=".*?"/i, "$1");
						this.add( name, newHtml, name );
					} else {
						this.add( name, styles[ name ].buildPreview(), name );
					}

				}
			},

			onClick: function( value ) {
				editor.focus();
				editor.fire( 'saveSnapshot' );

				var style = styles[ value ];

				editor[ this.getValue() == value ? 'removeStyle' : 'applyStyle' ]( style );

				var scope = parent.angular.element(bodyeditor).scope();
				scope.fontSelected = value;
				this.setStyle( 'font-family', style._.definition.styles['font-family'] );
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

						// Check if the element is removable by any of
						// the styles.
						for ( var value in styles ) {
							if ( styles[ value ].checkElementMatch( element, true, editor ) ) {
								if ( value != currentValue ) {
									this.setValue( value );
									this.setStyle( 'font-family', styles[ value ]._.definition.styles['font-family'] );
								}
								return;
							} else {
								var scope = parent.angular.element(bodyeditor).scope();
								var fontFamily = element.getComputedStyle('font-family');
								var split = fontFamily.split(',')[0];
								split = split.replace(/'/g, '');
								split = split.replace(/"/g, '');
								var match = value.replace(/-/g, ' ');

								if ( split === match ) {
									if ( typeof value !== 'undefined' ) {
										scope.fontSelected = value;
									}
								}

								var ems = null;
								if ( element.$.nodeName === 'SPAN' ) {
									ems = element.$.style.fontSize;
								} else if ( !element.$.className && !element.$.style.fontSize ) {
									var scope = parent.angular.element(bodyeditor).scope();
									if ( typeof scope.selectedStyle.css !== 'undefined' ) {
										ems = scope.selectedStyle.css['font-size'];
									}
								} else {
									//compute EMs because computed style returns pixels
									var parentPx = parseInt(window.getComputedStyle(element.$.parentNode, null).fontSize, 10);
									var px = parseInt(element.getComputedStyle('font-size'));
									var pxInEms = Math.floor((px / parentPx) * 10) / 10;
									ems = pxInEms + 'em';
								}

								if ( split === match || ems === value ) {
									if ( value != currentValue ) {
										this.setValue( value );
										this.setStyle( 'font-family', styles[ value ]._.definition.styles['font-family'] );
									}
									return;
								}
							}
						}
					}

					// If no styles match, just empty it.
					this.setValue( '', defaultLabel );
				}, this );
			},

			refresh: function() {
				if ( !editor.activeFilter.check( style ) )
					this.setState( CKEDITOR.TRISTATE_DISABLED );
			}
		} );
	}

	CKEDITOR.plugins.add( 'font', {
		requires: 'richcombo',
		lang: 'af,ar,bg,bn,bs,ca,cs,cy,da,de,el,en,en-au,en-ca,en-gb,eo,es,et,eu,fa,fi,fo,fr,fr-ca,gl,gu,he,hi,hr,hu,id,is,it,ja,ka,km,ko,ku,lt,lv,mk,mn,ms,nb,nl,no,pl,pt,pt-br,ro,ru,si,sk,sl,sq,sr,sr-latn,sv,th,tr,tt,ug,uk,vi,zh,zh-cn', // %REMOVE_LINE_CORE%
		init: function( editor ) {
			var config = editor.config;

			addCombo( editor, 'Font', 'family', editor.lang.font, config.font_names, config.font_defaultLabel, config.font_style, 30 );
			addCombo( editor, 'FontSize', 'size', editor.lang.font.fontSize, config.fontSize_sizes, config.fontSize_defaultLabel, config.fontSize_style, 40 );
		}
	} );
} )();

/**
 * The list of fonts names to be displayed in the Font combo in the toolbar.
 * Entries are separated by semi-colons (`';'`), while it's possible to have more
 * than one font for each entry, in the HTML way (separated by comma).
 *
 * A display name may be optionally defined by prefixing the entries with the
 * name and the slash character. For example, `'Arial/Arial, Helvetica, sans-serif'`
 * will be displayed as `'Arial'` in the list, but will be outputted as
 * `'Arial, Helvetica, sans-serif'`.
 *
 *		config.font_names =
 *			'Arial/Arial, Helvetica, sans-serif;' +
 *			'Times New Roman/Times New Roman, Times, serif;' +
 *			'Verdana';
 *
 *		config.font_names = 'Arial;Times New Roman;Verdana';
 *
 * @cfg {String} [font_names=see source]
 * @member CKEDITOR.config
 */
CKEDITOR.config.font_names = 'Aleo;' + 'Arsenal;' + 'Autour One;' + 'Bob;' + 'Charis;' + 'Chunk;' + 'CMU Bright;' +
	'CMU Concrete;' + 'CMU Sans Serif;' + 'CMU Serif;' + 'CMU Typewriter;' + 'Courier Prime;' + 'Crimson;' +
	'Deja Vu Sans;' + 'Deja Vu Sans Condensed;' + 'Deja Vu Mono;' + 'Deja Vu Serif;' + 'Deja Vu Serif Condensed;' +
	'Gabriela;' + 'Junicode;' + 'Kelson;' + 'Kreon;' + 'League Gothic;' + 'Linux Biolinum;' + 'Merriweather;' +
	'Nobile;' + 'Open Sans;' + 'Prime;' + 'Quicksand;' + 'Raleway;' + 'Rambla;' + 'Roboto;' + 'Roboto Condensed' +
	'Signika;' + 'Source Code Pro;' + 'Source Sans Pro;' + 'Ubuntu;' + 'Ubuntu Mono;' + 'Vidaloka;' + 'Voltaire;';

/**
 * The text to be displayed in the Font combo is none of the available values
 * matches the current cursor position or text selection.
 *
 *		// If the default site font is Arial, we may making it more explicit to the end user.
 *		config.font_defaultLabel = 'Arial';
 *
 * @cfg {String} [font_defaultLabel='']
 * @member CKEDITOR.config
 */
CKEDITOR.config.font_defaultLabel = '';

/**
 * The style definition to be used to apply the font in the text.
 *
 *		// This is actually the default value for it.
 *		config.font_style = {
 *			element:		'span',
 *			styles:			{ 'font-family': '#(family)' },
 *			overrides:		[ { element: 'font', attributes: { 'face': null } } ]
 *     };
 *
 * @cfg {Object} [font_style=see example]
 * @member CKEDITOR.config
 */
CKEDITOR.config.font_style = {
	element: 'span',
	styles: { 'font-family': '#(family)' },
	overrides: [ {
		element: 'font', attributes: { 'face': null }
	} ]
};

/**
 * The list of fonts size to be displayed in the Font Size combo in the
 * toolbar. Entries are separated by semi-colons (`';'`).
 *
 * Any kind of "CSS like" size can be used, like `'12px'`, `'2.3em'`, `'130%'`,
 * `'larger'` or `'x-small'`.
 *
 * A display name may be optionally defined by prefixing the entries with the
 * name and the slash character. For example, `'Bigger Font/14px'` will be
 * displayed as `'Bigger Font'` in the list, but will be outputted as `'14px'`.
 *
 *		config.fontSize_sizes = '16/16px;24/24px;48/48px;';
 *
 *		config.fontSize_sizes = '12px;2.3em;130%;larger;x-small';
 *
 *		config.fontSize_sizes = '12 Pixels/12px;Big/2.3em;30 Percent More/130%;Bigger/larger;Very Small/x-small';
 *
 * @cfg {String} [fontSize_sizes=see source]
 * @member CKEDITOR.config
 */
CKEDITOR.config.fontSize_sizes = '1em;1.1em;1.2em;1.3em;1.4em;1.5em;1.6em;1.7em;1.8em;1.9em;2em;2.1em;2.2em;2.3em;2.4em;2.5em;2.6em;2.7em;2.8em;2.9em;3em;3.1em;3.2em;3.3em;3.4em;3.5em;3.6em;3.7em;3.8em;3.9em;4em;4.1em;4.2em;4.3em;4.4em;4.5em;4.6em;4.7em;4.8em;4.9em;5em;';

/**
 * The text to be displayed in the Font Size combo is none of the available
 * values matches the current cursor position or text selection.
 *
 *		// If the default site font size is 12px, we may making it more explicit to the end user.
 *		config.fontSize_defaultLabel = '12px';
 *
 * @cfg {String} [fontSize_defaultLabel='']
 * @member CKEDITOR.config
 */
CKEDITOR.config.fontSize_defaultLabel = '';

/**
 * The style definition to be used to apply the font size in the text.
 *
 *		// This is actually the default value for it.
 *		config.fontSize_style = {
 *			element:		'span',
 *			styles:			{ 'font-size': '#(size)' },
 *			overrides:		[ { element :'font', attributes: { 'size': null } } ]
 *		};
 *
 * @cfg {Object} [fontSize_style=see example]
 * @member CKEDITOR.config
 */
CKEDITOR.config.fontSize_style = {
	element: 'span',
	styles: { 'font-size': '#(size)' },
	overrides: [ {
		element: 'font', attributes: { 'size': null }
	} ]
};
