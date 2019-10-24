interface ComponentProperties {
}
interface ComponentState<Props extends {}> {
	properties: Props
	[key: string]: any;
}
interface SnComponent<InitState = any, Properties = any> {
	initialState?: InitState
	properties?: Properties
	view: Function,
	styles?: string,
	actions?: {
		[action: string]: {
			private?: boolean
		}
	},
	actionHandlers?: {
		[action: string]: (...args: Array<any>) => any | {
			effect: () => any,
			args: Array<any>
		}
	},
	eventHandlers?: Array<{
		events: Array<keyof DocumentEventMap>,
		effact(): void,
		target?: Element
	}>
}
interface ComponentService {
	t(formatter: string, ...args: any): string;
	createHttpEffect(url: string, options?: any): Function;
	createUpdateStateEffect(reducer: (...args: Array<any>) => void): Function;
	createGraphQLEffect(query: string, options?: any): Function;
	createAmbSubscriptionEffect(channelId: string, options?: any): Function;
	createElement(tag: string, props?: any, ...children: Array<any>): any,
	Fragment(): any,
	getDefaultTemplate<InitState, Properties>(): SnComponent<InitState, Properties>
	registerComponent<Name extends string, Config extends SnComponent>(name: Name, config: Config): void;
}
interface Window {
	snComponentServices: ComponentService
}
interface Dispatch<T extends ComponentState<{}>> {
	(type: string, payload?: any, meta?: any, errorFlag?: boolean): void;
	dispatch(type: string, payload: any): void;
	updateState(obj: Partial<{ [prop in keyof Omit<T, "properties">]: T[prop] }>): void;
	updateState(obj: { path: string, value: any, operation?: 'set' | 'assign' | 'merge' | 'pop' | 'push' | 'shift' | 'unshift' | 'splice' | 'concat' }): void;
	updateProperties(obj: Partial<{ [prop in keyof T["properties"]]: T['properties'][prop] }>): void;
}
type ExtractComponentProps<T, U, E> = T extends U ? T : T extends E ? never : T;
type ComponentPropValueOf<T> = T[ExtractComponentProps<keyof T, 'default', 'readonly' | 'reflect' | 'unstableParse' | 'unstablePreseveEmptyStr'>];
type ComponentPropType<T> = { [p in keyof T]: ComponentPropValueOf<T[p]> extends (...args) => infer R ? R : ComponentPropValueOf<T[p]> };
