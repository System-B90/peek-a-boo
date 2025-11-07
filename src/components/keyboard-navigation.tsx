/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-namespace */
import { KeyboardEvent } from "react";

namespace KeyboardNavigation {

    export type EventKeyValues<T extends Element, E extends Event> = Pick<
        React.MouseEvent<T, E>,
        Exclude<keyof React.MouseEvent<T, E>,
            keyof {
                nativeEvent: E,
                currentTarget: T,
                target: T,
                bubbles: boolean,
                cancelable: boolean,
                defaultPrevented: boolean,
                eventPhase: number,
                isTrusted: boolean,
                preventDefault: () => void,
                isDefaultPrevented: () => boolean,
                stopPropagation: () => void,
                isPropagationStopped: () => boolean,
                persist: () => void,
                timeStamp: number,
                type: string,
            }
        >
    >;

    export const createSyntheticEvent = <T extends Element, E extends Event>(event: E, kv: EventKeyValues<T, E>): React.MouseEvent<T, E> => {
        let isDefaultPrevented = false;
        let isPropagationStopped = false;
        const preventDefault = () => {
            isDefaultPrevented = true;
            event.preventDefault();
        };
        const stopPropagation = () => {
            isPropagationStopped = true;
            event.stopPropagation();
        };
        return {
            nativeEvent: event,
            currentTarget: event.currentTarget as EventTarget & T,
            target: event.target as EventTarget & T,
            bubbles: event.bubbles,
            cancelable: event.cancelable,
            defaultPrevented: event.defaultPrevented,
            eventPhase: event.eventPhase,
            isTrusted: event.isTrusted,
            preventDefault,
            isDefaultPrevented: () => isDefaultPrevented,
            stopPropagation,
            isPropagationStopped: () => isPropagationStopped,
            persist: () => { },
            timeStamp: event.timeStamp,
            type: event.type,
            ...kv
        };
    };

    export const keyboardToMouseClickEvent = <T extends HTMLElement>(event: KeyboardEvent<T>): React.MouseEvent<T, MouseEvent> => {
        return createSyntheticEvent(
            new MouseEvent('click', {
                bubbles: true,
                cancelable: true,
                button: 0, // Left mouse button
                clientX: event.currentTarget.getBoundingClientRect().x,
                clientY: event.currentTarget.getBoundingClientRect().y,
            }), {
            altKey: event.altKey,
            button: 0,
            buttons: 0,
            clientX: event.currentTarget.getBoundingClientRect().x,
            clientY: event.currentTarget.getBoundingClientRect().y,
            ctrlKey: event.ctrlKey,
            getModifierState: function (_key: React.ModifierKey): boolean {
                throw new Error("Function not implemented.");
            },
            metaKey: event.metaKey,
            movementX: 0,
            movementY: 0,
            pageX: 0,
            pageY: 0,
            relatedTarget: null,
            screenX: event.currentTarget.offsetLeft,
            screenY: event.currentTarget.offsetTop,
            shiftKey: event.shiftKey,
            detail: event.detail,
            view: event.view,
        });
    };

    export const isClick = (event: KeyboardEvent<HTMLDivElement>) => event.key === 'Enter' || event.key === 'Space' || event.key === ' ';
};

export default KeyboardNavigation;
