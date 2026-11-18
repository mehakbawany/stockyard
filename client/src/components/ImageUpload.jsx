import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { UploadCloud, Trash2, Image as ImageIcon, Camera } from 'lucide-react';
import api, { errMsg } from '../api';

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'], MAX = 2 * 1024 * 1024;

// Authenticated ImageKit upload: signed params come from our backend, file goes straight to ImageKit.
// variant="box"    -> the dashed drag & drop box (products etc.)
// variant="avatar" -> a round photo with a camera button (profile page)
export default function ImageUpload({ value, onChange, onRemove, shape = 'square', label = 'Upload image', removable = true, variant = 'box', fallback = '' }) {
  const [progress, setProgress] = useState(null), [drag, setDrag] = useState(false), ref = useRef();

  const upload = async file => {
    if (!file) return;
    if (!ALLOWED.includes(file.type)) return toast.error('Only JPG, PNG, WEBP or GIF images are allowed');
    if (file.size > MAX) return toast.error('Image must be 2 MB or smaller');
    try {
      setProgress(0);
      const { data: a } = await api.get('/upload/auth');
      const fd = new FormData();
      fd.append('file', file); fd.append('fileName', file.name); fd.append('publicKey', a.publicKey);
      fd.append('signature', a.signature); fd.append('expire', a.expire); fd.append('token', a.token); fd.append('folder', '/stockyard');
      const res = await new Promise((resolve, reject) => {
        const x = new XMLHttpRequest();
        x.open('POST', 'https://upload.imagekit.io/api/v1/files/upload');
        x.upload.onprogress = e => e.lengthComputable && setProgress(Math.round(e.loaded / e.total * 100));
        x.onload = () => { const j = JSON.parse(x.responseText || '{}'); x.status < 300 ? resolve(j) : reject(new Error(j.message || 'Upload failed')); };
        x.onerror = () => reject(new Error('Network error while uploading'));
        x.send(fd);
      });
      onChange({ url: res.url, fileId: res.fileId });
      toast.success('Image uploaded');
    } catch (e) { toast.error(errMsg(e)); } finally { setProgress(null); if (ref.current) ref.current.value = ''; }
  };

  const input = <input ref={ref} type="file" accept={ALLOWED.join(',')} hidden onChange={e => upload(e.target.files[0])} />;
  const dnd = {
    onDragOver: e => { e.preventDefault(); setDrag(true); }, onDragLeave: () => setDrag(false),
    onDrop: e => { e.preventDefault(); setDrag(false); upload(e.dataTransfer.files[0]); }
  };

  if (variant === 'avatar') {
    return (
      <div className={`avatar-up ${drag ? 'drag' : ''}`} {...dnd}>
        <div className="avatar-lg">
          {value ? <img src={value} alt="" /> : <span>{fallback || <ImageIcon size={30} />}</span>}
          {progress !== null && <div className="avatar-progress">{progress}%</div>}
          <button type="button" className="avatar-cam" onClick={() => ref.current.click()} aria-label={label} title={label}><Camera size={16} /></button>
        </div>
        {value && removable && progress === null && <button type="button" className="linkbtn" onClick={onRemove}><Trash2 size={13} /> Remove photo</button>}
        {input}
      </div>
    );
  }

  return (
    <div className={`upload ${shape} ${drag ? 'drag' : ''}`} {...dnd}>
      <div className="preview">{value ? <img src={value} alt="preview" /> : <ImageIcon size={28} />}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <b>{label}</b>
        <div className="muted" style={{ fontSize: 13, margin: '2px 0 10px' }}>Drag & drop or browse. JPG, PNG, WEBP up to 2 MB.</div>
        {progress !== null
          ? <div className="bar acc"><i style={{ width: `${progress}%` }} /></div>
          : <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" className="btn sm" onClick={() => ref.current.click()}><UploadCloud size={15} /> {value ? 'Replace' : 'Choose file'}</button>
              {value && removable && <button type="button" className="btn sm ghost" onClick={onRemove}><Trash2 size={15} /> Remove</button>}
            </div>}
        {input}
      </div>
    </div>
  );
}
