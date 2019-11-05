/**
 * TODO: Should we do validate function in scenarios where args are are not required.
 * but should be validate?
 */
export default class Base {
	/**
	 * Function constructor().
	 *
	 * Create Commands Base.
	 *
	 * @param {{}} args
	 */
	constructor( args ) {
		this.args = args;

		// Who ever need do something before without `super` the constructor can use `initialize` method.
		this.initialize( args );

		// Validate args before run.
		this.validateArgs( args );

		// Acknowledge self about which command it run.
		this.currentCommand = $e.commands.getCurrent( 'document' );
	}

	/**
	 * Function requireContainer().
	 *
	 * Validate `arg.container` & `arg.containers`.
	 *
	 * @param {{}} args
	 *
	 * @throws Error
	 */
	requireContainer( args = this.args ) {
		if ( ! args.container && ! args.containers ) {
			throw Error( 'container or containers are required.' );
		}

		if ( args.container && args.containers ) {
			throw Error( 'container and containers cannot go together please select one of them.' );
		}

		const containers = args.containers || [ args.container ];

		containers.forEach( ( container ) => {
			this.requireArgumentInstance( 'container', elementorModules.editor.Container, { container } );
		} );
	}

	/**
	 * Function requireArgument().
	 *
	 * Validate property in args.
	 *
	 * @param {string} property
	 * @param {{}} args
	 *
	 * @throws Error
	 *
	 */
	requireArgument( property, args = this.args ) {
		if ( ! args.hasOwnProperty( property ) ) {
			throw Error( `${ property } is required.` );
		}
	}

	/**
	 * Function requireArgumentType().
	 *
	 * Validate property in args using `type === typeof(args.whatever)`.
	 *
	 * @param {string} property
	 * @param {string} type
	 * @param {{}} args
	 *
	 * @throws Error
	 *
	 */
	requireArgumentType( property, type, args = this.args ) {
		this.requireArgument( property, args );

		if ( ( typeof args[ property ] !== type ) ) {
			throw Error( `${ property } invalid type: ${ type }.` );
		}
	}

	/**
	 * Function requireArgumentInstance().
	 *
	 * Validate property in args using `args.whatever instanceof instance`.
	 *
	 * @param {string} property
	 * @param {instanceof} instance
	 * @param {{}} args
	 *
	 * @throws Error
	 *
	 */
	requireArgumentInstance( property, instance, args = this.args ) {
		this.requireArgument( property, args );

		if ( ! ( args[ property ] instanceof instance ) ) {
			throw Error( `${ property } invalid instance.` );
		}
	}

	/**
	 * Function requireArgumentConstructor().
	 *
	 * Validate property in args using `type === args.whatever.constructor`.
	 *
	 * @param {string} property
	 * @param {*} type
	 * @param {{}} args
	 *
	 * @throws Error
	 *
	 */
	requireArgumentConstructor( property, type, args = this.args ) {
		this.requireArgument( property, args );

		if ( args[ property ].constructor !== type ) {
			throw Error( `${ property } invalid constructor type.` );
		}
	}
	/**
	 * Function initialize().
	 *
	 * Initialize command, called after construction.
	 *
	 * @param {{}} args
	 */
	initialize() {}

	/**
	 * Function validateArgs().
	 *
	 * Validate command arguments.
	 *
	 * @param {{}} args
	 */
	validateArgs( args ) {}

	/**
	 * Function isDataChanged().
	 *
	 * Whether the editor needs to set change flag on/off.
	 *
	 * @returns {boolean}
	 */
	isDataChanged() {
		return false;
	}

	/**
	 * Function apply().
	 *
	 * Do the actual command.
	 *
	 * @param {{}}
	 */
	apply( args ) {
		throw Error( 'apply() should be implemented, please provide apply functionality.' );
	}

	/**
	 * Function run().
	 *
	 * Run command with history & hooks.
	 *
	 * @returns {*}
	 */
	run() {
		let result;

		this.onBeforeRun( this.args );

		try {
			this.onBeforeApply( this.args );

			result = this.apply( this.args );
		} catch ( e ) {
			this.onCatchApply( e );

			return false;
		}

		this.onAfterApply( this.args, result );

		if ( this.isDataChanged() ) {
			$e.run( 'document/save/saver', { status: true } );
		}

		this.onAfterRun( this.args, result );

		return result;
	}

	/**
	 * Function onBeforeRun.
	 *
	 * Called before run().
	 *
	 * @param {{}} args
	 */
	onBeforeRun( args ) {
		$e.events.runBefore( this.currentCommand, args );
	}

	/**
	 * Function onAfterRun.
	 *
	 * Called after run().
	 *
	 * @param {{}} args
	 * @param {*} result
	 */
	onAfterRun( args, result ) {
		$e.events.runAfter( this.currentCommand, args, result );
	}

	/**
	 * Function onBeforeApply.
	 *
	 * Called before apply().
	 *
	 * @param {{}} args
	 */
	onBeforeApply( args ) {
		$e.hooks.runDependency( this.currentCommand, args );
	}

	/**
	 * Function onAfterApply.
	 *
	 * Called after apply().
	 *
	 * @param {{}} args
	 * @param {*} result
	 */
	onAfterApply( args, result ) {
		$e.hooks.runAfter( this.currentCommand, args, result );
	}

	/**
	 * Function onCatchApply.
	 *
	 * Called after apply() failed.
	 *
	 * @param {Error} e
	 */
	onCatchApply( e ) {
		if ( $e.devTools ) {
			$e.devTools.log.error( e );
		}

		if ( elementor.isTesting ) {
			console.error( e );
		}
	}
}
