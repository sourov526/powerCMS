"use client";
import type Quill from "quill";
import { useEffect, useMemo, useRef } from "react";
import "../styles/quill.css";
import { Text } from "./atoms/typography/Text";
import { Flex } from "./layouts/Flex";

type QuillConstructor = {
  new (element: Element, options: Record<string, unknown>): Quill;
  register: (path: Record<string, unknown>, suppressWarning?: boolean) => void;
  find?: (node: Node, bubble?: boolean) => unknown;
};

type UploadedMediaResponse = {
  url?: string;
  error?: string;
};

function normalizeHtml(value?: string | null) {
  if (!value || value === "<p><br></p>") return "";
  return value;
}

function pickFile(accept: string) {
  return new Promise<File | null>((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = accept;
    input.onchange = () => resolve(input.files?.[0] ?? null);
    input.click();
  });
}

async function uploadMediaFile(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/media/upload", {
    method: "POST",
    body: formData,
  });

  const payload = (await response.json().catch(() => null)) as
    | UploadedMediaResponse
    | { url?: string; error?: string }
    | null;

  if (!response.ok || !payload?.url) {
    throw new Error(payload?.error || "Upload failed.");
  }

  return payload.url;
}

function isImageFile(file: File) {
  return file.type.startsWith("image/");
}

function extensionFromMime(mimeType: string) {
  const normalized = mimeType.toLowerCase();
  if (normalized === "image/jpeg") return "jpg";
  if (normalized === "image/svg+xml") return "svg";
  const parts = normalized.split("/");
  return parts[1] || "png";
}

async function dataUrlToFile(dataUrl: string) {
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  const extension = extensionFromMime(blob.type || "image/png");
  return new File([blob], `image.${extension}`, { type: blob.type });
}

function clampActiveTooltip(container: HTMLElement | null) {
  if (!container) return;

  const tooltip = container.querySelector<HTMLElement>(
    ".ql-tooltip.ql-editing"
  );
  if (!tooltip) return;

  const padding = 12;
  const containerRect = container.getBoundingClientRect();
  const tooltipRect = tooltip.getBoundingClientRect();
  let nextLeft = tooltip.offsetLeft;

  if (tooltipRect.left < containerRect.left + padding) {
    nextLeft += containerRect.left + padding - tooltipRect.left;
  }

  if (tooltipRect.right > containerRect.right - padding) {
    nextLeft -= tooltipRect.right - (containerRect.right - padding);
  }

  tooltip.style.left = `${Math.max(padding, nextLeft)}px`;
}

export type Props = {
  className?: string;
  label: string;
  isLabelBold?: boolean;
  required?: boolean;
  placeholder?: string;
  helper?: string;
  helperTooltip?: string;
  dataCy?: string;
  defaultValue?: string;
  name?: string;
  error?: { message?: string } | undefined;
  setValue?: (name: string, value: string) => void;
  onChange?: (value: string) => void;
};
export const RichTextArea = (props: Props) => {
  const {
    className,
    label,
    dataCy,
    isLabelBold,
    required,
    name = "",
    error,
    placeholder,
    helper,
    helperTooltip,
    defaultValue,
    onChange,
    setValue,
  } = props;
  const editorHostRef = useRef<HTMLDivElement | null>(null);
  const editorContainerRef = useRef<HTMLDivElement | null>(null);
  const quillInstanceRef = useRef<Quill | null>(null);
  const pendingHtmlRef = useRef<string | null>(
    normalizeHtml(defaultValue) || null
  );
  const lastAppliedValueRef = useRef<string>(normalizeHtml(defaultValue));
  const lastEmittedRef = useRef<string>(normalizeHtml(defaultValue));
  const setValueRef = useRef(setValue);
  const onChangeRef = useRef(onChange);
  const nameRef = useRef(name);
  const placeholderRef = useRef(placeholder);

  useEffect(() => {
    setValueRef.current = setValue;
    onChangeRef.current = onChange;
    nameRef.current = name;
    placeholderRef.current = placeholder;
  }, [setValue, onChange, name, placeholder]);

  useEffect(() => {
    const nextValue = normalizeHtml(defaultValue);
    if (nextValue === lastAppliedValueRef.current) return;

    lastAppliedValueRef.current = nextValue;
    lastEmittedRef.current = nextValue;

    const quill = quillInstanceRef.current;
    if (!quill) {
      pendingHtmlRef.current = nextValue || null;
      return;
    }

    const currentValue = normalizeHtml(quill.root.innerHTML);
    if (currentValue === nextValue) return;

    if (!nextValue) {
      quill.setText("");
      return;
    }

    quill.clipboard.dangerouslyPasteHTML(nextValue);
  }, [defaultValue]);

  const toolbarOptions = useMemo(
    () => [
      [{ font: [] }, { size: ["small", false, "large", "huge"] }],
      // [{ header: [1, 2, 3, 4, 5, 6, false] }],
      ["bold", "italic", "underline", "strike"],
      [{ color: [] }, { background: [] }],
      [{ script: "sub" }, { script: "super" }],
      [
        { list: "ordered" },
        { list: "bullet" },
        { indent: "-1" },
        { indent: "+1" },
      ],
      [{ direction: "rtl" }, { align: [] }],
      ["link", "image", "video", "table"],
      ["blockquote", "code-block"],
      ["clean"],
    ],
    []
  );
  const formats = useMemo(
    () => [
      "font",
      "size",
      "header",
      "bold",
      "italic",
      "underline",
      "strike",
      "color",
      "background",
      "script",
      "list",
      "indent",
      "direction",
      "align",
      "link",
      "image",
      "video",
      "blockquote",
      "code-block",
      "table",
    ],
    []
  );
  useEffect(() => {
    let mounted = true;
    const hostNode = editorHostRef.current;
    const init = async () => {
      if (!hostNode || quillInstanceRef.current) return;
      const mountNode = document.createElement("div");
      mountNode.className = "p-4 rich-admin";
      hostNode.innerHTML = "";
      hostNode.appendChild(mountNode);
      editorContainerRef.current = mountNode;
      const QuillModule = await import("quill");
      if (!mounted || !editorContainerRef.current) return;
      const Quill = (QuillModule.default ??
        QuillModule) as unknown as QuillConstructor;
      const quill = new Quill(editorContainerRef.current, {
        theme: "snow",
        placeholder: placeholderRef.current,
        modules: { toolbar: toolbarOptions, table: true },
        formats,
      });
      const toolbar = quill.getModule("toolbar") as {
        addHandler?: (name: string, handler: () => void) => void;
      } | null;

      const uploadingImages = new WeakSet<HTMLImageElement>();
      let scanTimeout: number | null = null;

      const replaceBase64Images = async () => {
        const images = Array.from(quill.root.querySelectorAll("img"));
        for (const image of images) {
          const src = image.getAttribute("src") || "";
          if (!src.startsWith("data:")) continue;
          if (uploadingImages.has(image)) continue;
          uploadingImages.add(image);
          try {
            const file = await dataUrlToFile(src);
            const url = await uploadMediaFile(file);

            const blot = Quill.find?.(image);
            const index =
              blot && typeof (quill as unknown as { getIndex: (b: unknown) => number }).getIndex === "function"
                ? (quill as unknown as { getIndex: (b: unknown) => number }).getIndex(blot)
                : null;

            if (typeof index === "number" && index >= 0) {
              quill.deleteText(index, 1, "silent");
              quill.insertEmbed(index, "image", url, "silent");
            } else {
              image.setAttribute("src", url);
            }
          } catch {
            // Leave the data URL in place if upload fails.
          }
        }
      };

      const queueBase64Scan = () => {
        if (scanTimeout !== null) return;
        scanTimeout = window.setTimeout(() => {
          scanTimeout = null;
          void replaceBase64Images();
        }, 50);
      };

      if (toolbar?.addHandler) {
        toolbar.addHandler("table", () => {
          const table = quill.getModule("table") as {
            insertTable?: (rows: number, columns: number) => void;
          } | null;
          if (table?.insertTable) {
            table.insertTable(3, 3);
          }
        });

        toolbar.addHandler("image", () => {
          void (async () => {
            const file = await pickFile("image/*");
            if (!file) return;
            try {
              const url = await uploadMediaFile(file);
              const range = quill.getSelection(true);
              const index = range?.index ?? quill.getLength();
              quill.insertEmbed(index, "image", url, "user");
              quill.setSelection(index + 1, 0, "silent");
            } catch {
              window.alert("Image upload failed.");
            }
          })();
        });
      }

      const handlePaste = (event: ClipboardEvent) => {
        const files = Array.from(event.clipboardData?.files ?? []).filter(
          isImageFile
        );
        if (!files.length) return;

        event.preventDefault();
        void (async () => {
          for (const file of files) {
            try {
              const url = await uploadMediaFile(file);
              const range = quill.getSelection(true);
              const index = range?.index ?? quill.getLength();
              quill.insertEmbed(index, "image", url, "user");
              quill.setSelection(index + 1, 0, "silent");
            } catch {
              window.alert("Image upload failed.");
            }
          }
        })();
      };

      const handleDrop = (event: DragEvent) => {
        const files = Array.from(event.dataTransfer?.files ?? []).filter(
          isImageFile
        );
        if (!files.length) return;

        event.preventDefault();
        void (async () => {
          for (const file of files) {
            try {
              const url = await uploadMediaFile(file);
              const range = quill.getSelection(true);
              const index = range?.index ?? quill.getLength();
              quill.insertEmbed(index, "image", url, "user");
              quill.setSelection(index + 1, 0, "silent");
            } catch {
              window.alert("Image upload failed.");
            }
          }
        })();
      };

      const handleDragOver = (event: DragEvent) => {
        const hasFiles = (event.dataTransfer?.types ?? []).includes("Files");
        if (hasFiles) event.preventDefault();
      };

      quill.root.addEventListener("paste", handlePaste);
      quill.root.addEventListener("drop", handleDrop);
      quill.root.addEventListener("dragover", handleDragOver);

      quillInstanceRef.current = quill;
      const initialHtml = pendingHtmlRef.current;
      if (initialHtml) {
        quill.clipboard.dangerouslyPasteHTML(initialHtml);
        pendingHtmlRef.current = null;
        queueBase64Scan();
      }

      const queueTooltipClamp = () => {
        window.requestAnimationFrame(() => {
          clampActiveTooltip(editorContainerRef.current);
        });
      };

      const tooltipObserver = new MutationObserver(() => {
        queueTooltipClamp();
      });

      const tooltip = editorContainerRef.current.querySelector(".ql-tooltip");
      if (tooltip) {
        tooltipObserver.observe(tooltip, {
          attributes: true,
          attributeFilter: ["class", "style"],
        });
      }

      const handleTextChange = () => {
        const normalized = normalizeHtml(quill.root.innerHTML);
        lastAppliedValueRef.current = normalized;
        if (
          normalized.includes('src="data:') ||
          normalized.includes("src='data:")
        ) {
          queueBase64Scan();
          return;
        }
        if (normalized === lastEmittedRef.current) return;
        lastEmittedRef.current = normalized;
        if (typeof setValueRef.current === "function") {
          setValueRef.current(nameRef.current, normalized);
        }
        if (typeof onChangeRef.current === "function") {
          onChangeRef.current(normalized);
        }
      };

      quill.on("text-change", handleTextChange);
      quill.on("selection-change", queueTooltipClamp);

      return () => {
        quill.off("text-change", handleTextChange);
        quill.off("selection-change", queueTooltipClamp);
        quill.root.removeEventListener("paste", handlePaste);
        quill.root.removeEventListener("drop", handleDrop);
        quill.root.removeEventListener("dragover", handleDragOver);
        tooltipObserver.disconnect();
        if (scanTimeout !== null) {
          window.clearTimeout(scanTimeout);
        }
      };
    };
    let cleanup: (() => void) | undefined;
    void init().then((result) => {
      cleanup = result;
    });
    return () => {
      mounted = false;
      if (cleanup) cleanup();
      if (quillInstanceRef.current) {
        quillInstanceRef.current = null;
      }
      if (hostNode) {
        hostNode.innerHTML = "";
      }
      editorContainerRef.current = null;
    };
  }, [formats, toolbarOptions]);

  return (
    <Flex direction="col" className={`w-full   bg-white ${className}`}>
      <Flex
        direction="row"
        justifyContent="start"
        alignItems="start"
        className="w-full"
        gap="4px"
      >
        <Text
          dataCy={dataCy}
          text={label}
          className={`text-[16px] ${
            isLabelBold ? "font-bold" : "font-semibold"
          } text-slate-700`}
        />
        {required ? <Text text="*" className="font-bold text-red-600" /> : null}
        {helper ? (
          <span
            className=" inline-flex items-center rounded-full border border-slate-200 bg-slate-50  text-[11px] text-slate-600"
            title={helperTooltip || helper}
          >
            {helper}
          </span>
        ) : null}
      </Flex>
      <div className="w-full overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div ref={editorHostRef} className="rich-admin-host w-full min-w-0" />
      </div>
      {error?.message ? (
        <div
          className={`text-sm text-rose-600 error-${name}-message`}
          id="span"
        >
          {error.message}
        </div>
      ) : null}
    </Flex>
  );
};
