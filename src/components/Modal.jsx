import React from "react";
import { X } from "lucide-react";
function Modal({
  title: title,
  children: children,
  close: close,
  wide = false,
}) {
  const dialogRef = React.useRef(null);
  return (
    React.useEffect(() => {
      var V;
      const D = document.activeElement;
      return (
        (V = dialogRef.current) == null || V.focus(),
        () => (D == null ? void 0 : D.focus())
      );
    }, []),
    React.useEffect(() => {
      const D = (q) => {
        q.key === "Escape" && close();
      };
      document.addEventListener("keydown", D);
      const V = document.body.style.overflow;
      return (
        (document.body.style.overflow = "hidden"),
        () => {
          (document.removeEventListener("keydown", D),
            (document.body.style.overflow = V));
        }
      );
    }, [close]),
    (
      <div
        className={"modal-backdrop"}
        onClick={(D) => {
          D.target === D.currentTarget && close();
        }}
      >
        <section
          ref={dialogRef}
          tabIndex={-1}
          onKeyDown={(D) => {
            var p;
            if (D.key !== "Tab") return;
            const V = Array.from(
                ((p = dialogRef.current) == null
                  ? void 0
                  : p.querySelectorAll(
                      "button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href]",
                    )) || [],
              ),
              q = V[0],
              x = V.at(-1);
            D.shiftKey &&
            (document.activeElement === q ||
              document.activeElement === dialogRef.current)
              ? (D.preventDefault(), x == null || x.focus())
              : !D.shiftKey &&
                document.activeElement === x &&
                (D.preventDefault(), q == null || q.focus());
          }}
          role={"dialog"}
          aria-modal={"true"}
          aria-label={title}
          className={`modal ${wide ? "wide" : ""}`}
        >
          <div className={"modal-heading"}>
            <h2>{title}</h2>
            <button
              className={"icon-button"}
              aria-label={"닫기"}
              onClick={close}
            >
              <X size={20} />
            </button>
          </div>
          {children}
        </section>
      </div>
    )
  );
}
export default Modal;
