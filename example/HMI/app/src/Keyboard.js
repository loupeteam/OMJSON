// import "../../jquery/dist/jquery.js"
import "../../jquery-ui/dist/jquery-ui.js"

import('../../virtual-keyboard/dist/js/jquery.keyboard.js').then((module) => {
	console.log('keyboard loaded')
	$('input').keyboard(keysNum);
})
function addCSS(path){
	let css = document.createElement('link')
	css.rel = 'stylesheet'
	css.href = path
	document.head.appendChild(css)	
}
addCSS('virtual-keyboard/dist/css/keyboard-dark.min.css');
addCSS('app/css/keyboard.css')


/* Define Keyboards */
var keysQwerty = {
	layout: 'qwerty',
	// rtl: true,
	autoAccept: true,
	usePreview: false,

	//Select text on visible
	visible: function (event, keyboard, el) {
		el.select();
	},
	enterNavigation: true,
	switchInput: function (keyboard, goToNext, isAccepted) {
		keyboard.accept();
	},
	// position: {
	// 	// null = attach to input/textarea;
	// 	of: null,
	// 	my : 'center top', // 'center top', (position under keyboard)
	// 	collision: 'flip',
	// 	// used when "usePreview" is false
	// 	at2: 'center bottom'
	//   },
	layout: 'custom',
	customLayout: {
		'normal': [
			'` 1 2 3 4 5 6 7 8 9 0 - = {b}',
			'{tab} q w e r t y u i o p [ ] \\',
			'a s d f g h j k l ; \' ',
			'{shift} z x c v b n m , . / {shift}',
			'{accept} {space}'
		],
		'shift': [
			'~ ! @ # $ % ^ & * ( ) _ + {b}',
			'{tab} Q W E R T Y U I O P { } |',
			'A S D F G H J K L : " ',
			'{shift} Z X C V B N M < > ? {shift}',
			'{accept} {space}'
		]
	},

	reposition: true
};

var keysNum = {
	enterNavigation: true,
	switchInput: function (keyboard, goToNext, isAccepted) {
		keyboard.accept();
	},

	layout: 'custom',
	display: {
		'bksp': "\u2190",
		'accept': 'return',
		'a': '\u2714:Accept',
		'normal': 'ABC',
		'meta1': '.?123',
		'meta2': '#+='
	},
	customLayout: {
		'normal': [
			'7 8 9 {bksp}',
			'4 5 6 {clear}',
			'1 2 3 {sign}',
			'0 . {a}'
		],
	},

	//Select text on visible
	visible: function (event, keyboard, el) {
		el.select();
	},

	restrictInput: false, // Prevent keys not in the displayed keyboard from being typed in
	preventPaste: false, // prevent ctrl-v and right click
	autoAccept: true,
	usePreview: false,
	reposition: true
};

$(document).on({
	click: function () {
		let $this = $(this)
		if (!$this.getkeyboard()) {

			if (this.classList.contains('webhmi-num-value')) {
				$this.keyboard(keysNum)
			}
			else {
				$this.keyboard(keysQwerty)
			}
			$this.getkeyboard().reveal()

		}
	}
}, 'input:not( [type=checkbox] )');

