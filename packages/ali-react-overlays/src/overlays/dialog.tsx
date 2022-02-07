import cx from 'classnames';
import * as React from 'react';
import { useMemo } from 'react';
import { noop } from 'rxjs';
import { useOverlayBehavior } from '../context';
import { animations } from '../utils/animations';
import { useMemoizedMergeRefs } from '../utils/common';
import { makeDetachedRenderContainer, useRenderContainerFactory } from '../utils/render-containers';
import { DialogFooter, DialogInner } from './dialog-inner';
import { makeDialogQuickTools } from './dialog-quick-tools';
import {
  IOverlayAnimationProps,
  IOverlayBackdropProps,
  IOverlayCloseActions,
  IOverlayLifecycles,
  IOverlayPortalProps,
  Overlay,
} from './overlay';
import { Position, PositionOffset, PositionPlacement } from './position';

export interface DialogProps
  extends IOverlayCloseActions,
    IOverlayLifecycles,
    IOverlayBackdropProps,
    IOverlayAnimationProps,
    IOverlayPortalProps {
  style?: React.CSSProperties;
  className?: string;
  visible?: boolean;
  onRequestClose?(reason: any): void;
  content?: React.ReactNode;
  children?: React.ReactNode;

  /** 使用 render prop 的形式指定弹层内容，用于精确控制 DOM 结构 */
  renderChildren?(pass: { ref: React.Ref<Element> }): React.ReactNode;
  title?: React.ReactNode;

  /** @displayType null | React.ReactElement */
  footer?: null | React.ReactElement;

  onOk?(): void;
  onCancel?(): void;
  placement?: PositionPlacement;
  offset?: PositionOffset;

  /** 是否显示对话框关闭图标 */
  canCloseByIcon?: boolean;
}

export function Dialog(props: DialogProps) {
  const {
    visible,
    children,
    content = children,
    renderChildren,
    title,
    footer,
    onRequestClose,
    hasBackdrop,
    onCancel,
    onOk,
    canCloseByEsc,
    canCloseByOutSideClick,
    disableScroll,
    canCloseByIcon,
    className,
    style,
    portalContainer: portalContainerProp,
    placement,
    offset,
    ...overlayProps
  } = props;

  const overlayBehavior = useOverlayBehavior();
  const portalContainer = portalContainerProp ?? overlayBehavior.portalContainer;
  const mergeRefs = useMemoizedMergeRefs();

  return (
    <Overlay
      {...overlayProps}
      visible={visible}
      onRequestClose={onRequestClose}
      hasBackdrop={hasBackdrop}
      disableScroll={disableScroll}
      canCloseByEsc={canCloseByEsc}
      canCloseByOutSideClick={canCloseByOutSideClick}
      animation={overlayProps.animation ?? Dialog.defaultAnimation}
      portalContainer={portalContainer}
      renderChildren={({ ref: overlayContentRef }) => (
        <Position placement={placement} offset={offset} container={portalContainer}>
          {(positionTargetRef) => {
            const ref = mergeRefs(overlayContentRef, positionTargetRef);
            if (renderChildren != null) {
              return renderChildren({ ref });
            }

            return (
              <div ref={ref} style={props.style} className={cx('aro-dialog', props.className)}>
                <DialogInner
                  title={title}
                  content={content}
                  footer={footer}
                  onOk={onOk}
                  onCancel={onCancel}
                  canCloseByIcon={canCloseByIcon}
                  onRequestClose={onRequestClose}
                />
              </div>
            );
          }}
        </Position>
      )}
    />
  );
}

Dialog.defaultProps = {
  hasBackdrop: true,
  onCancel: noop,
  onOk: noop,
  canCloseByEsc: false,
  canCloseByOutSideClick: false,
  disableScroll: true,
  canCloseByIcon: false,
  placement: 'center',
};
Dialog.defaultAnimation = { in: animations.zoomIn, out: animations.zoomOut };

Dialog.Inner = DialogInner;
Dialog.Footer = DialogFooter;

const staticQuickTools = makeDialogQuickTools(makeDetachedRenderContainer);
Dialog.show = staticQuickTools.show;
Dialog.confirm = staticQuickTools.confirm;
Dialog.alert = staticQuickTools.alert;
Dialog.close = staticQuickTools.close;
Dialog.closeAll = staticQuickTools.closeAll;

Dialog.useDialog = () => {
  const [containerFactory, contextHolder] = useRenderContainerFactory();
  const dialog = useMemo(() => makeDialogQuickTools(containerFactory), [containerFactory]);

  return [dialog, contextHolder] as const;
};
