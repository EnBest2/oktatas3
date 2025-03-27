import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const SUPABASE_URL = 'https://ejrucgtmgiwpfexbvwxa.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJI...TnJQ'; // Használhatod a teljes kulcsod
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
}

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
}

window.deleteFile = async function (fileName) {
  const confirmDelete = confirm(`Biztosan törlöd ezt a fájlt: ${fileName}?`);
  if (!confirmDelete) return;

  const { error } = await supabase.storage
    .from('adatok')
    .remove([`${selectedCategory}/${fileName}`]);

  if (error) {
    alert('Hiba törléskor: ' + error.message);
  } else {
    alert('Sikeres törlés!');
    listFiles();
  }
}

async function listFiles() {
  const list = document.getElementById('fileList');
  list.innerHTML = '';

  if (!selectedCategory) return;

  const { data, error } = await supabase.storage
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
    div.classList.add('file-item');

    const { data: { publicUrl } } = supabase
      .storage
      .from('adatok')
      .getPublicUrl(`${selectedCategory}/${file.name}`);

    const link = document.createElement('a');
    link.href = publicUrl;
    link.textContent = file.name;
    link.target = '_blank';
    link.style.color = 'white';

    const del = document.createElement('button');
    del.textContent = 'Törlés';
    del.onclick = () => deleteFile(file.name);
    del.classList.add('delete-btn');

    div.appendChild(link);
    div.appendChild(del);
    list.appendChild(div);
  });
}
