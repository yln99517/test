import * as React from 'react';
declare module 'react' {
	interface HTMLAttributes<T> extends AriaAttributes, DOMAttributes<T> {
		attrs?: { [key: string]: any }
	}
}
