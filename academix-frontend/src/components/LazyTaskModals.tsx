import { ComponentType, lazy, Suspense, useEffect, useState } from "react";
import type NewTaskModalComponent from "./NewTaskModal/NewTaskModal";
import type UserTaskModalComponent from "./UserTaskModal/UserTaskModal";

// The task modals are large (editor, uploads, audio/video, checklists...) and are used in many
// places. These wrappers load the modal code the first time `openModal` becomes truthy, then keep
// the modal mounted, so after the first open it behaves exactly like a static import.
function lazyModal<P extends { openModal: unknown }>(
  load: () => Promise<{ default: ComponentType<P> }>
) {
  // Typed as ComponentType<P>: lazy() adds ref typing that TS cannot match against a generic P.
  const Modal = lazy(load) as unknown as ComponentType<P>;
  return function LazyModal(props: P) {
    const [opened, setOpened] = useState(!!props.openModal);
    useEffect(() => {
      if (props.openModal) setOpened(true);
    }, [props.openModal]);

    if (!opened && !props.openModal) return null;
    return (
      <Suspense fallback={null}>
        <Modal {...props} />
      </Suspense>
    );
  };
}

export const NewTaskModal = lazyModal<React.ComponentProps<typeof NewTaskModalComponent>>(
  () => import("./NewTaskModal/NewTaskModal")
);

export const UserTaskModal = lazyModal<React.ComponentProps<typeof UserTaskModalComponent>>(
  () => import("./UserTaskModal/UserTaskModal")
);
