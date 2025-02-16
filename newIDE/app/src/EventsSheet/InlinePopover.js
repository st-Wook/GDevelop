// @flow
import * as React from 'react';
import Popper from '@material-ui/core/Popper';
import Background from '../UI/Background';
import ClickAwayListener from '@material-ui/core/ClickAwayListener';
import { Column, Line } from '../UI/Grid';
import {
  shouldCloseOrCancel,
  shouldFocusNextField,
  shouldFocusPreviousField,
  shouldSubmit,
  shouldValidate,
} from '../UI/KeyboardShortcuts/InteractionKeys';
import { doesPathContainDialog } from '../UI/MaterialUISpecificUtil';
import { useResponsiveWindowWidth } from '../UI/Reponsive/ResponsiveWindowMeasurer';

const styles = {
  popover: {
    paddingBottom: 10,
    overflowY: 'auto',

    // Never show a horizontal scrollbar
    overflowX: 'hidden',

    // Restrict size in case of extra small or large popover (though this should not happen)
    minHeight: 30,
    maxHeight: 400,

    // When displayed in an events sheet that has Mosaic windows (see `EditorMosaic`) next to it,
    // it could be displayed behind them, because they have a z-index of 1, and 4 for the window titles :/
    // use a z-index of 5 then. Only one InlinePopover should be shown at a time anyway.
    zIndex: 5,
  },
};

type Props = {|
  children: React.Node,
  anchorEl: ?HTMLElement,
  open: boolean,
  onRequestClose: () => void,
  onApply: () => void,
|};

/**
 * A popover that can be used to show the field to edit a parameter, without
 * opening the full instruction editor.
 * Works like a dialog when opened (trapping the focus, dismissed on Escape,
 * dismissed on click/touch outside) but positioned under the edited parameter.
 */
export default function InlinePopover(props: Props) {
  const startSentinel = React.useRef<?HTMLDivElement>(null);
  const endSentinel = React.useRef<?HTMLDivElement>(null);
  const windowWidth = useResponsiveWindowWidth();

  return (
    <ClickAwayListener
      // The click away listener cannot be closed on mousedown event because
      // it does not give enough time to expression fields to be blurred and to
      // persist the last typed value.
      // TODO: Prevent default behavior when the mouseup event results from a text
      // selection that started inside the expression field and the user released
      // the mouse outside the InlinePopover.
      // See https://github.com/4ian/GDevelop/issues/1718.
      mouseEvent="onMouseUp"
      onClickAway={event => {
        // Clicks on dialogs (or their backdrop element) generated by
        // the AlertProvider seem to trigger this click away listener
        // even if they are displayed above the InlinePopover element.
        // To avoid this, we need to check the click is not made on a dialog.
        if (doesPathContainDialog(event.composedPath())) {
          return;
        }
        // For a popover, clicking/touching away means validating,
        // as it's very easy to do it and almost the only way to do it on a touch screen.
        // The user can cancel with Escape.
        if (event instanceof MouseEvent) {
          // onClickAway is triggered on a "click" (which can actually happen
          // on a touchscreen too!).
          // The click already gave the opportunity to the popover content to
          // get blurred (allowing "semi controlled" text fields
          // to apply their changes). We can close now.
          props.onApply();
        } else {
          // Give a bit of time to the popover content to be blurred
          // (useful for the "semi controlled" text fields for example)
          // for touch events.
          //
          // This timeout needs to be at least around 50ms, otherwise
          // blur events for GenericExpressionField are not triggered on iOS.
          // There might be a better way to do this without waiting this much time.
          setTimeout(() => {
            props.onApply();
          }, 50);
        }
      }}
    >
      <Popper
        open={props.open}
        anchorEl={props.anchorEl}
        style={{
          ...styles.popover,
          // On mobile, make it take full screen width, but not too much for large mobile phones.
          // On desktop, make it take a min width, to ensure most fields with translations are well displayed.
          width: windowWidth === 'small' ? '100%' : 'auto',
          minWidth: windowWidth === 'small' ? 'auto' : 320,
          maxWidth: windowWidth === 'small' ? 320 : 600,
        }}
        placement="bottom-start"
        onKeyDown={event => {
          // Much like a dialog, offer a way to close the popover
          // with a key.
          // Note that the content of the popover can capture the event
          // and stop its propagation (for example, the GenericExpressionField
          // when showing autocompletion), which is fine.
          if (shouldCloseOrCancel(event)) {
            props.onRequestClose();
          } else if (shouldSubmit(event)) {
            props.onApply();
          } else if (shouldValidate(event)) {
            // Stop propagation to avoid immediately re-opening the inline popover (as the key down
            // would be detected by the parameter of the instruction).
            event.stopPropagation();
            event.preventDefault();

            props.onApply();
          }

          // Also like a dialog, add a "focus trap". If the user keeps pressing tab
          // (or shift+tab), we "loop" the focus so that it stays inside the popover.
          // Otherwise, the focus would escape and could go in some unrelated element
          // in the events sheet, triggering a scroll, which would be very disturbing
          // and would break the keyboard navigation.
          if (shouldFocusNextField(event)) {
            if (event.target && event.target === endSentinel.current) {
              event.stopPropagation();
              event.preventDefault();
              if (startSentinel.current) {
                startSentinel.current.focus();
              }
            }
          } else if (shouldFocusPreviousField(event)) {
            if (event.target && event.target === startSentinel.current) {
              event.stopPropagation();
              event.preventDefault();
              if (endSentinel.current) {
                endSentinel.current.focus();
              }
            }
          }
        }}
      >
        <Background>
          <div tabIndex={0} ref={startSentinel} />
          <Column expand>
            <Line>{props.children}</Line>
          </Column>
          <div tabIndex={0} ref={endSentinel} />
        </Background>
      </Popper>
    </ClickAwayListener>
  );
}
