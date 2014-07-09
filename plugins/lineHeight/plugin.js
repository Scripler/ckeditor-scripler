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
			//toolbar: 'styles,' + order,
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
							if ( styles[ value ].checkElementMatch( element, true ) ) {
								if ( value != currentValue )
									this.setValue( value );
								return;
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

	CKEDITOR.plugins.add( 'lineHeight', {
		requires: 'richcombo',
		lang: 'en', // %REMOVE_LINE_CORE%
		init: function( editor ) {
			var config = editor.config;

			addCombo( editor, 'LineHeight', 'height', editor.lang.lineHeight, config.lineHeight_sizes, config.lineHeight_defaultLabel, config.lineHeight_style, 40 );
		}
	} );
} )();


CKEDITOR.config.lineHeight_sizes = '1,00;1,02;1,03;1,04;1,05;1,06;1,07;1,08;1,09;1,10;1,11;1,12;1,13;1,14;1,15;1,16;1,17;1,18;1,19;1,20;1,21;1,22;1,23;1,24;1,25;1,26;1,27;1,28;1,29;1,30;1,31;1,32;1,33;1,34;1,35;1,36;1,37;1,38;1,39;1,40;1,41;1,42;1,43;1,44;1,45;1,46;1,47;1,48;1,49;1,50;1,51;1,52;1,53;1,54;1,55;1,56;1,57;1,58;1,59;1,60;1,61;1,62;1,63;1,64;1,65;1,66;1,67;1,68;1,69;1,70;1,71;1,72;1,73;1,74;1,75;1,76;1,77;1,78;1,79;1,80;1,81;1,82;1,83;1,84;1,85;1,86;1,87;1,88;1,89;1,90;1,91;1,92;1,93;1,94;1,95;1,96;1,97;1,98;1,99;2,00;';

CKEDITOR.config.lineHeight_defaultLabel = '';

CKEDITOR.config.lineHeight_style = {
	element: 'p',
	styles: { 'line-height': '#(height)' },
	overrides: [ {
		element: 'line', attributes: { 'height': null }
	} ]
};
