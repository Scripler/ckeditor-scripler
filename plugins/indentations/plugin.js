/*
Copyright (c) 2003-2012, CKSource - Frederico Knabben. All rights reserved.
For licensing, see LICENSE.html or http://ckeditor.com/license
*/

/**
 * @file Increse and decrease indent commands.
 */

(function()
{
	var listNodeNames = { ol : 1, ul : 1 },
		isNotWhitespaces = CKEDITOR.dom.walker.whitespaces( true ),
		isNotBookmark = CKEDITOR.dom.walker.bookmark( false, true );

	function onSelectionChange2( evt )
	{
		if ( evt.editor.readOnly )
			return null;

		var editor = evt.editor,
			elementPath = evt.data.path,
			list = elementPath && elementPath.contains( listNodeNames ),
			firstBlock = elementPath.block || elementPath.blockLimit;
		var selection = editor.getSelection();

		if ( !selection ) {
			return;
		}

		if ( list )
				return this.setState( CKEDITOR.TRISTATE_OFF );

		var outdentCommand = editor.commands.outdentTop;
		var indent = parseInt( firstBlock.getStyle( getIndentCssProperty( this.name ) ), 10 );
		if ( !this.useIndentClasses && this.name == 'indenttop' && indent > 0) {
			outdentCommand.setState( CKEDITOR.TRISTATE_ENABLED );
		}

		if ( !this.useIndentClasses && this.name == 'indenttop' )
			return this.setState( CKEDITOR.TRISTATE_ENABLED );

		if ( !firstBlock )
			return this.setState( CKEDITOR.TRISTATE_DISABLED );

		if ( this.useIndentClasses )
		{
			var indentClass = firstBlock.$.className.match( this.classNameRegex ),
				indentStep = 0;
			if ( indentClass )
			{
				indentClass = indentClass[1];
				indentStep = this.indentClassMap[ indentClass ];
			}
			if ( ( this.name == 'outdenttop' && !indentStep ) ||
					( this.name == 'indenttop' && indentStep == editor.config.indentClasses.length ) )
				return this.setState( CKEDITOR.TRISTATE_DISABLED );
			return this.setState( CKEDITOR.TRISTATE_OFF );
		}
		else
		{
			var indent = parseInt( firstBlock.getStyle( getIndentCssProperty( this.name ) ), 10 );
			if ( isNaN( indent ) )
				indent = 0;
			if ( indent <= 0 )
				return this.setState( CKEDITOR.TRISTATE_DISABLED );
			return this.setState( CKEDITOR.TRISTATE_OFF );
		}
	}

	function indentCommand( editor, name )
	{
		this.name = name;
		this.useIndentClasses = editor.config.indentClasses && editor.config.indentClasses.length > 0;
		if ( this.useIndentClasses )
		{
			this.classNameRegex = new RegExp( '(?:^|\\s+)(' + editor.config.indentClasses.join( '|' ) + ')(?=$|\\s)' );
			this.indentClassMap = {};
			for ( var i = 0 ; i < editor.config.indentClasses.length ; i++ )
				this.indentClassMap[ editor.config.indentClasses[i] ] = i + 1;
		}

		//this.startDisabled = name == 'outdentTop' || name == 'outdentBottom';
	}

	// Returns the CSS property to be used for identing a given element.
	function getIndentCssProperty( name )
	{
		if ( name == 'indenttop' || name == 'outdenttop') {
			return 'margin-top';
		}
		if ( name == 'indentbottom' || name == 'outdentbottom' ) {
			return 'margin-bottom';
		}
		if ( name == 'indenttext' || name == 'outdenttext' ) {
			return 'text-indent';
		}
	}

	function isListItem( node )
	{
		return node.type == CKEDITOR.NODE_ELEMENT && node.is( 'li' );
	}

	indentCommand.prototype = {
		exec : function( editor )
		{
			var self = this, database = {};

			function indentList( listNode )
			{
				// Our starting and ending points of the range might be inside some blocks under a list item...
				// So before playing with the iterator, we need to expand the block to include the list items.
				var startContainer = range.startContainer,
					endContainer = range.endContainer;
				while ( startContainer && !startContainer.getParent().equals( listNode ) )
					startContainer = startContainer.getParent();
				while ( endContainer && !endContainer.getParent().equals( listNode ) )
					endContainer = endContainer.getParent();

				if ( !startContainer || !endContainer )
					return;

				// Now we can iterate over the individual items on the same tree depth.
				var block = startContainer,
					itemsToMove = [],
					stopFlag = false;
				while ( !stopFlag )
				{
					if ( block.equals( endContainer ) )
						stopFlag = true;
					itemsToMove.push( block );
					block = block.getNext();
				}
				if ( itemsToMove.length < 1 )
					return;

				// Do indent or outdent operations on the array model of the list, not the
				// list's DOM tree itself. The array model demands that it knows as much as
				// possible about the surrounding lists, we need to feed it the further
				// ancestor node that is still a list.
				var listParents = listNode.getParents( true );
				for ( var i = 0 ; i < listParents.length ; i++ )
				{
					if ( listParents[i].getName && listNodeNames[ listParents[i].getName() ] )
					{
						listNode = listParents[i];
						break;
					}
				}
				var indentOffset = self.name == 'indenttop' || self.name == 'indentbottom' ? 1 : -1,
					startItem = itemsToMove[0],
					lastItem = itemsToMove[ itemsToMove.length - 1 ];

				// Convert the list DOM tree into a one dimensional array.
				var listArray = CKEDITOR.plugins.list.listToArray( listNode, database );

				// Apply indenting or outdenting on the array.
				var baseIndent = listArray[ lastItem.getCustomData( 'listarray_index' ) ].indent;
				for ( i = startItem.getCustomData( 'listarray_index' ); i <= lastItem.getCustomData( 'listarray_index' ); i++ )
				{
					listArray[ i ].indent += indentOffset;
					// Make sure the newly created sublist get a brand-new element of the same type. (#5372)
					var listRoot = listArray[ i ].parent;
					listArray[ i ].parent = new CKEDITOR.dom.element( listRoot.getName(), listRoot.getDocument() );
				}

				for ( i = lastItem.getCustomData( 'listarray_index' ) + 1 ;
						i < listArray.length && listArray[i].indent > baseIndent ; i++ )
					listArray[i].indent += indentOffset;

				// Convert the array back to a DOM forest (yes we might have a few subtrees now).
				// And replace the old list with the new forest.
				var newList = CKEDITOR.plugins.list.arrayToList( listArray, database, null, editor.config.enterMode, listNode.getDirection() );

				// Avoid nested <li> after outdent even they're visually same,
				// recording them for later refactoring.(#3982)
				if ( self.name == 'outdenttop' )
				{
					var parentLiElement;
					if ( ( parentLiElement = listNode.getParent() ) && parentLiElement.is( 'li' ) )
					{
						var children = newList.listNode.getChildren(),
							pendingLis = [],
							count = children.count(),
							child;

						for ( i = count - 1 ; i >= 0 ; i-- )
						{
							if ( ( child = children.getItem( i ) ) && child.is && child.is( 'li' )  )
								pendingLis.push( child );
						}
					}
				}

				if ( newList )
					newList.listNode.replace( listNode );

				// Move the nested <li> to be appeared after the parent.
				if ( pendingLis && pendingLis.length )
				{
					for (  i = 0; i < pendingLis.length ; i++ )
					{
						var li = pendingLis[ i ],
							followingList = li;

						// Nest preceding <ul>/<ol> inside current <li> if any.
						while ( ( followingList = followingList.getNext() ) &&
							   followingList.is &&
							   followingList.getName() in listNodeNames )
						{
							// IE requires a filler NBSP for nested list inside empty list item,
							// otherwise the list item will be inaccessiable. (#4476)
							if ( CKEDITOR.env.ie && !li.getFirst( function( node ){ return isNotWhitespaces( node ) && isNotBookmark( node ); } ) )
								li.append( range.document.createText( '\u00a0' ) );

							li.append( followingList );
						}

						li.insertAfter( parentLiElement );
					}
				}
			}

			function indentBlock()
			{
				var iterator = range.createIterator(),
					enterMode = editor.config.enterMode;
				iterator.enforceRealBlocks = true;
				iterator.enlargeBr = enterMode != CKEDITOR.ENTER_BR;
				var block;
				while ( ( block = iterator.getNextParagraph( enterMode == CKEDITOR.ENTER_P ? 'p' : 'div' ) ) )
					indentElement( block );
			}

			function indentElement( element, dir )
			{
				if ( element.getCustomData( 'indent_processed' ) )
					return false;

				if ( self.useIndentClasses )
				{
					// Transform current class name to indent step index.
					var indentClass = element.$.className.match( self.classNameRegex ),
							indentStep = 0;
					if ( indentClass )
					{
						indentClass = indentClass[1];
						indentStep = self.indentClassMap[ indentClass ];
					}

					// Operate on indent step index, transform indent step index back to class
					// name.
					if ( self.name == 'outdenttop' || self.name == 'outdentbottom' )
						indentStep--;
					else
						indentStep++;

					if ( indentStep < 0 )
						return false;

					indentStep = Math.min( indentStep, editor.config.indentClasses.length );
					indentStep = Math.max( indentStep, 0 );
					element.$.className = CKEDITOR.tools.ltrim( element.$.className.replace( self.classNameRegex, '' ) );
					if ( indentStep > 0 )
						element.addClass( editor.config.indentClasses[ indentStep - 1 ] );
				}
				else
				{
					var indentCssProperty = getIndentCssProperty( self.name ),
						currentOffset = parseInt( element.getStyle( indentCssProperty ), 10 );
					if ( isNaN( currentOffset ) )
						currentOffset = 0;
					var indentOffset = editor.config.indentOffset || 40;
					currentOffset += ( self.name == 'indenttop' || self.name == 'indentbottom' || self.name == 'indenttext' ? 1 : -1 ) * indentOffset;

					if ( currentOffset < 0 )
						return false;

					currentOffset = Math.max( currentOffset, 0 );
					currentOffset = Math.ceil( currentOffset / indentOffset ) * indentOffset;
					element.setStyle( indentCssProperty, currentOffset ? currentOffset + ( editor.config.indentUnit || 'px' ) : '' );
					if ( element.getAttribute( 'style' ) === '' )
						element.removeAttribute( 'style' );
				}

				CKEDITOR.dom.element.setMarker( database, element, 'indent_processed', 1 );
				return true;
			}

			var selection = editor.getSelection(),
				bookmarks = selection.createBookmarks( 1 ),
				ranges = selection && selection.getRanges( 1 ),
				range;


			var iterator = ranges.createIterator();
			while ( ( range = iterator.getNextRange() ) )
			{
				var rangeRoot = range.getCommonAncestor(),
					nearestListBlock = rangeRoot;

				while ( nearestListBlock && !( nearestListBlock.type == CKEDITOR.NODE_ELEMENT &&
					listNodeNames[ nearestListBlock.getName() ] ) )
					nearestListBlock = nearestListBlock.getParent();

				// Avoid having selection enclose the entire list. (#6138)
				// [<ul><li>...</li></ul>] =><ul><li>[...]</li></ul>
				if ( !nearestListBlock )
				{
					var selectedNode = range.getEnclosedNode();
					if ( selectedNode
						&& selectedNode.type == CKEDITOR.NODE_ELEMENT
						&& selectedNode.getName() in listNodeNames)
					{
						range.setStartAt( selectedNode, CKEDITOR.POSITION_AFTER_START );
						range.setEndAt( selectedNode, CKEDITOR.POSITION_BEFORE_END );
						nearestListBlock = selectedNode;
					}
				}

				// Avoid selection anchors under list root.
				// <ul>[<li>...</li>]</ul> =>	<ul><li>[...]</li></ul>
				if ( nearestListBlock && range.startContainer.type == CKEDITOR.NODE_ELEMENT
					&& range.startContainer.getName() in listNodeNames )
				{
					var walker = new CKEDITOR.dom.walker( range );
					walker.evaluator = isListItem;
					range.startContainer = walker.next();
				}

				if ( nearestListBlock && range.endContainer.type == CKEDITOR.NODE_ELEMENT
					&& range.endContainer.getName() in listNodeNames )
				{
					walker = new CKEDITOR.dom.walker( range );
					walker.evaluator = isListItem;
					range.endContainer = walker.previous();
				}

				if ( nearestListBlock )
				{
					var firstListItem = nearestListBlock.getFirst( isListItem ),
						hasMultipleItems = !!firstListItem.getNext( isListItem ),
						rangeStart = range.startContainer,
						indentWholeList = firstListItem.equals( rangeStart ) || firstListItem.contains( rangeStart );

					// Indent the entire list if cursor is inside the first list item. (#3893)
					// Only do that for indenting or when using indent classes or when there is something to outdent. (#6141)
					if ( !( indentWholeList &&
						( self.name == 'indenttop' || self.name == 'indentbottom' || self.name == 'indenttext' || self.useIndentClasses || parseInt( nearestListBlock.getStyle( getIndentCssProperty( self.name ) ), 10 ) ) &&
							indentElement( nearestListBlock, !hasMultipleItems && firstListItem.getDirection() ) ) )
								indentList( nearestListBlock );
				}
				else
					indentBlock();
			}

			// Clean up the markers.
			CKEDITOR.dom.element.clearAllMarkers( database );

			editor.forceNextSelectionCheck();
			selection.selectBookmarks( bookmarks );
		}
	};

	CKEDITOR.plugins.add( 'indentations',
	{
		init : function( editor )
		{
			// Register commands.
			var indentTop = editor.addCommand( 'indentTop', new indentCommand( editor, 'indentTop' ) ),
				outdentTop = editor.addCommand( 'outdentTop', new indentCommand( editor, 'outdentTop' ) ),
				indentBottom = editor.addCommand( 'indentBottom', new indentCommand( editor, 'indentBottom' ) ),
				outdentBottom = editor.addCommand( 'outdentBottom', new indentCommand( editor, 'outdentBottom' ) ),
				indentText = editor.addCommand( 'indentText', new indentCommand( editor, 'indentText' ) ),
				outdentText = editor.addCommand( 'outdentText', new indentCommand( editor, 'outdentText' ) );

			// Register the toolbar buttons.
			editor.ui.addButton( 'IndentTop',
				{
					label : 'Increase top margin',
					command : 'indentTop',
					icon: CKEDITOR.plugins.getPath('indentations') + 'icons/arrow-up.png'
				});
			editor.ui.addButton( 'IndentTopIcon',
				{
					label : 'Top margin',
					icon: CKEDITOR.plugins.getPath('indentations') + 'icons/margin-top.png'
				});
			editor.ui.addButton( 'OutdentTop',
				{
					label : 'Decrease top margin',
					command : 'outdentTop',
					icon: CKEDITOR.plugins.getPath('indentations') + 'icons/arrow-down.png'
				});
			editor.ui.addButton( 'IndentBottom',
				{
					label : 'Increase bottom margin',
					command : 'indentBottom',
					icon: CKEDITOR.plugins.getPath('indentations') + 'icons/arrow-up.png'
				});
			editor.ui.addButton( 'IndentBottomIcon',
				{
					label : 'Bottom margin',
					icon: CKEDITOR.plugins.getPath('indentations') + 'icons/margin-bottom.png'
				});
			editor.ui.addButton( 'OutdentBottom',
				{
					label : 'Decrease bottom margin',
					command : 'outdentBottom',
					icon: CKEDITOR.plugins.getPath('indentations') + 'icons/arrow-down.png'
				});
			editor.ui.addButton( 'IndentText',
				{
					label : 'Increase text indent',
					command : 'indentText',
					icon: CKEDITOR.plugins.getPath('indentations') + 'icons/arrow-up.png'
				});
			editor.ui.addButton( 'IndentTextIcon',
				{
					label : 'Text indent',
					icon: CKEDITOR.plugins.getPath('indentations') + 'icons/indent.png'
				});
			editor.ui.addButton( 'OutdentText',
				{
					label : 'Decrease text indent',
					command : 'outdentText',
					icon: CKEDITOR.plugins.getPath('indentations') + 'icons/arrow-down.png'
				});


      // add new buttons next to the original Indent & Outdent
      var config = editor.config;


			// Register the state changing handlers.
			//editor.on( 'selectionChange', CKEDITOR.tools.bind( onSelectionChange2, indentTop ) );
			//editor.on( 'selectionChange', CKEDITOR.tools.bind( onSelectionChange2, outdentTop ) );

			// [IE6/7] Raw lists are using margin instead of padding for visual indentation in wysiwyg mode. (#3893)
			if ( CKEDITOR.env.ie6Compat || CKEDITOR.env.ie7Compat )
			{
				editor.addCss(
					"ul,ol" +
					"{" +
					"	margin-left: 0px;" +
					"	padding-left: 40px;" +
					"}" );
			}

			editor.on( 'key', function( evt )
			{
				// Backspace at the beginning of  list item should outdent it.
				if ( editor.mode == 'wysiwyg' && evt.data.keyCode == 8 )
				{
					var sel = editor.getSelection(),
						range = sel.getRanges()[ 0 ],
						li;

					if ( range.collapsed &&
						 ( li = range.startContainer.getAscendant( 'li', 1 ) ) &&
						 range.checkBoundaryOfElement( li, CKEDITOR.START ) )
					{
						editor.execCommand( 'outdenttop' );
						evt.cancel();
					}
				}
			});
		},

		requires : [ 'list' ]
	} );
})();

/**
 * Size of each indentation step
 * @name CKEDITOR.config.indentOffset
 * @type Number
 * @default 40
 * @example
 * config.indentOffset = 4;
 */

 /**
 * Unit for the indentation style
 * @name CKEDITOR.config.indentUnit
 * @type String
 * @default 'px'
 * @example
 * config.indentUnit = 'em';
 */

 /**
 * List of classes to use for indenting the contents. If it's null, no classes will be used
 * and instead the {@link #indentUnit} and {@link #indentOffset} properties will be used.
 * @name CKEDITOR.config.indentClasses
 * @type Array
 * @default null
 * @example
 * // Use the classes 'Indent1', 'indentTop', 'Indent3'
 * config.indentClasses = ['Indent1', 'indentTop', 'Indent3'];
 */
