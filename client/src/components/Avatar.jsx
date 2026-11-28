// Owner: Member 1 (Frontend Developer)
import { fileUrl } from '../services/api';

const COLORS = ['#5b6cff', '#e85d9b', '#f59f00', '#12b886', '#7950f2', '#fa5252', '#1c7ed6', '#2f9e44'];

// same name -> same colour
const colorFor = (name = '') => COLORS[[...name].reduce((s, c) => s + c.charCodeAt(0), 0) % COLORS.length];

// `online` undefined -> no dot (groups); true -> green dot; false -> no dot
export default function Avatar({ name, url, size = 44, online }) {
  const style = { width: size, height: size, fontSize: size * 0.42 };
  return (
    <div className="avatar-wrap" style={{ width: size, height: size }}>
      {url ? (
        <img className="avatar" style={style} src={fileUrl(url)} alt={name} />
      ) : (
        <div className="avatar" style={{ ...style, background: colorFor(name) }} aria-hidden="true">
          {(name || '?').trim().charAt(0).toUpperCase()}
        </div>
      )}
      {online && <span className="online-dot" title="Online" />}
    </div>
  );
}
