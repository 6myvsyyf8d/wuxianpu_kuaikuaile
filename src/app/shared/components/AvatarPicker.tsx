import { useRef } from "react";

const EMOJIS = [
  "🎹", "🎵", "🎼", "🥁", "🎸", "🎻", "🎺", "🎷",
  "🐱", "🐶", "🐼", "🐨", "🦊", "🐸", "🐧", "🦁",
  "🌟", "⭐", "🌙", "☀️", "🌈",
];

interface Props {
  value: string;
  onChange: (avatar: string) => void;
}

function resizeImage(file: File, maxSize: number): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxSize || height > maxSize) {
          const ratio = Math.min(maxSize / width, maxSize / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/png"));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export default function AvatarPicker({ value, onChange }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const isImage = value.startsWith("data:");

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await resizeImage(file, 128);
    onChange(dataUrl);
    // reset so same file can be picked again
    e.target.value = "";
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-8 gap-1">
        {EMOJIS.map((emoji) => {
          const selected = !isImage && value === emoji;
          return (
            <button
              key={emoji}
              type="button"
              onClick={() => onChange(emoji)}
              className={`w-8 h-8 text-lg flex items-center justify-center rounded border-2 ${
                selected
                  ? "border-blue-500 bg-blue-50"
                  : "border-transparent hover:bg-gray-100"
              }`}
            >
              {emoji}
            </button>
          );
        })}
      </div>

      {isImage && (
        <div className="flex items-center gap-2">
          <img
            src={value}
            alt="头像预览"
            className="w-10 h-10 rounded border object-cover"
          />
          <span className="text-xs text-gray-500">自定义头像</span>
        </div>
      )}

      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="text-sm px-3 py-1 rounded border border-gray-300 hover:bg-gray-50 text-gray-600"
      >
        上传图片
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
