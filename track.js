const API_PROXY = '/api/track';

async function trackAWB(awb) {
  if (!awb) throw new Error('Missing AWB');
  const body = {
    awbs: [awb],
    getLastOnly: true
  };

  const resp = await fetch(API_PROXY, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`API Error: ${resp.status} ${txt}`);
  }

  return resp.json();
}

function renderResult(container, data) {
  container.innerHTML = '';
  if (!data || !data.length) {
    container.textContent = 'No tracking information returned.';
    return;
  }
  const shipment = data[0];
  const div = document.createElement('div');
  div.className = 'track-card';
  const header = document.createElement('h3');
  header.textContent = `AWB: ${shipment.AWB || ''}  Status: ${shipment.Status || ''}`;
  div.appendChild(header);

  if (shipment.Tracking && shipment.Tracking.length) {
    const list = document.createElement('ul');
    list.className = 'track-list';
    shipment.Tracking.forEach(t => {
      const li = document.createElement('li');
      li.textContent = `${t.StatusDate || ''} - ${t.Activity || ''} (${t.Location || ''})`;
      list.appendChild(li);
    });
    div.appendChild(list);
  } else {
    const p = document.createElement('p');
    p.textContent = 'No timeline available.';
    div.appendChild(p);
  }

  container.appendChild(div);
}

document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('btnTrack');
  const btnNew = document.getElementById('btnOpenNew');
  const input = document.getElementById('waybill');
  const res = document.getElementById('result');

  // Pre-fill API key from a prompt or safe config: ask user at runtime
  let apiKey = '';

  btn.addEventListener('click', async () => {
    const awb = input.value.trim();
    if (!awb) {
      alert('Please enter an AWB number');
      return;
    }
    if (!apiKey) apiKey = prompt('Enter your Expo Express API key (visible in requests):', 'A85A095C-731E-41DC-B81E-2D8981DB8775') || '';
    if (!apiKey) return;

    res.textContent = 'Loading...';
    try {
      const data = await trackAWB(awb, apiKey);
      // API returns object with TrackShipmentsResult or array; normalize
      const payload = data.TrackShipmentsResult || data;
      // Some responses include .Shipments array
      const shipments = payload && payload.Shipments ? payload.Shipments : (Array.isArray(payload) ? payload : [payload]);
      renderResult(res, shipments);
    } catch (err) {
      res.textContent = '';
      const e = document.createElement('div');
      e.className = 'error';
      e.textContent = 'Error: ' + (err.message || err);
      res.appendChild(e);
    }
  });

  btnNew.addEventListener('click', () => {
    const awb = input.value.trim();
    if (!awb) {
      alert('Please enter an AWB number');
      return;
    }
    const win = window.open('', '_blank');
    win.document.write('<html><head><title>Tracking result</title><link rel="stylesheet" href="style.css"></head><body><div id="out" style="padding:20px;">Loading...</div></body></html>');
    // Ask for API key in opener context
    const askKey = () => prompt('Enter your Expo Express API key (visible in requests):', 'A85A095C-731E-41DC-B81E-2D8981DB8775');
    const key = askKey();
    if (!key) {
      win.document.getElementById('out').textContent = 'No API key provided.';
      return;
    }
    trackAWB(awb, key).then(json => {
      const payload = json.TrackShipmentsResult || json;
      const shipments = payload && payload.Shipments ? payload.Shipments : (Array.isArray(payload) ? payload : [payload]);
      // render simple output
      const out = win.document.getElementById('out');
      out.innerHTML = '';
      shipments.forEach(s => {
        const h = win.document.createElement('h3');
        h.textContent = `AWB: ${s.AWB || ''}  Status: ${s.Status || ''}`;
        out.appendChild(h);
        if (s.Tracking && s.Tracking.length) {
          const ul = win.document.createElement('ul');
          s.Tracking.forEach(t => {
            const li = win.document.createElement('li');
            li.textContent = `${t.StatusDate || ''} - ${t.Activity || ''} (${t.Location || ''})`;
            ul.appendChild(li);
          });
          out.appendChild(ul);
        }
      });
    }).catch(err => {
      win.document.getElementById('out').textContent = 'Error: ' + (err.message || err);
    });
  });
});
