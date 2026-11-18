import Swal from 'sweetalert2';
const css = v => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
const base = () => ({ background: css('--surface'), color: css('--text'), customClass: { popup: 'swal-pop' } });
export const confirmBox = async ({ title, text, confirmText = 'Yes, continue', icon = 'warning', danger = true }) => {
  const r = await Swal.fire({ ...base(), title, text, icon, showCancelButton: true, confirmButtonText: confirmText, cancelButtonText: 'Keep it',
    confirmButtonColor: danger ? '#e5484d' : css('--accent'), cancelButtonColor: css('--muted'), reverseButtons: true, focusCancel: danger });
  return r.isConfirmed;
};
export const successBox = (title, text) => Swal.fire({ ...base(), icon: 'success', title, text, timer: 1700, showConfirmButton: false, timerProgressBar: true });
export const errorBox = (title, text) => Swal.fire({ ...base(), icon: 'error', title, text, confirmButtonColor: css('--accent') });
export const reviewBox = async ({ title, approve }) => {
  const r = await Swal.fire({ ...base(), title, icon: approve ? 'question' : 'warning', showCancelButton: true, confirmButtonText: approve ? 'Approve request' : 'Reject request',
    confirmButtonColor: approve ? '#12a150' : '#e5484d', reverseButtons: true,
    html: `<textarea id="sw-note" class="swal2-textarea" placeholder="Add a note for the supplier (optional)"></textarea>` +
      (approve ? `<label style="display:flex;gap:8px;justify-content:center;align-items:center;margin-top:6px"><input type="checkbox" id="sw-recv" checked/> Also receive this stock into the warehouse now</label>` : ''),
    preConfirm: () => ({ reviewNote: document.getElementById('sw-note').value, receiveStock: approve && document.getElementById('sw-recv')?.checked }) });
  return r.isConfirmed ? r.value : null;
};
