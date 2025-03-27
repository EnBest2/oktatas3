import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const SUPABASE_URL = 'https://ejrucgtmgiwpfexbvwxa.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqcnVjZ3RtZ2l3cGZleGJ2d3hhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMwNzEzMTYsImV4cCI6MjA1ODY0NzMxNn0.1J_eWcCSeJLdSNDDLNksr6TaQc3wCHKBRVc3a5pTnJQ';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

let selectedCategory = '';

function sanitizeFileName(filename) {
  return filename
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9\.\-_]/g, "_")
    .toLowerCase();
}

window.selectCategory = function (category) {
  selectedCategory = category;
  alert('Kategória: ' + category);
  listFiles();
};

window.handleUpload = async function () {
  const fileInput = document.getElementById('fileInput');
  const file = fileInput.files[0];
  const progressBar = document.getElementById('progressBar');

  if (!file || !selectedCategory) {
    alert('Válassz kategóriát és fájlt!');
    return;
  }

  const safeName = sanitizeFileName(file.name);
  progressBar.style.width = "0%";

  const reader = new FileReader();
  reader.onprogress = (e) => {
    if (e.lengthComputable) {
      const percent = (e.loaded / e.total) * 100;
      progressBar.style.width = percent + "%";
    }
  };

  reader.onloadend = async () => {
    const { error } = await supabase.storage
      .from('adatok')
      .upload(`${selectedCategory}/${safeName}`, file, { upsert: true });

    if (error) {
      alert('Hiba: ' + error.message);
    } else {
      progressBar.style.width = "100%";
      alert('Sikeres feltöltés!');
      listFiles();
    }
  };

  reader.readAsArrayBuffer(file);
};

async function listFiles() {
  const list = document.getElementById('fileList');
  list.innerHTML = '';
  if (!selectedCategory) return;

  const { data, error } = await supabase
    .storage
    .from('adatok')
    .list(`${selectedCategory}/`, { limit: 100 });

  if (error) {
    list.innerHTML = 'Hiba a listázáskor: ' + error.message;
    return;
  }

  if (data.length === 0) {
    list.innerHTML = '<i>Nincs fájl ebben a kategóriában.</i>';
    return;
  }

  data.forEach(file => {
    const div = document.createElement('div');
    div.className = 'file-item';

    const link = document.createElement('a');
    const { data: { publicUrl } } = supabase
      .storage
      .from('adatok')
      .getPublicUrl(`${selectedCategory}/${file.name}`);

    link.href = publicUrl;
    link.target = '_blank';
    link.textContent = file.name;
    link.style.color = 'white';
    link.style.marginRight = '10px';

    const delBtn = document.createElement('button');
    delBtn.textContent = 'Törlés';
    delBtn.onclick = async () => {
      const { error } = await supabase
        .storage
        .from('adatok')
        .remove([`${selectedCategory}/${file.name}`]);

      if (error) {
        alert('Hiba törléskor: ' + error.message);
      } else {
        alert('Törölve: ' + file.name);
        listFiles();
      }
    };

    div.appendChild(link);
    div.appendChild(delBtn);
    list.appendChild(div);
  });
}
