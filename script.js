// GANTI INI DENGAN URL APPS SCRIPT-MU!
const URL_GAS = "https://script.google.com/macros/s/AKfycbwQDbdvUkEoD0w1jhahbpsJFEFadR82H7KAn_5tutcuFy8bwZeOD_tTqLSzJ_aSEDgW/exec";

let stateItems = []; 
let editIndex = -1; 
let databaseArsip = []; 
let listCustomerDb = []; 
let databaseUsers = [];

function formatRp(angka) { return new Intl.NumberFormat('id-ID').format(Math.round(angka)); }
function penyebut(nilai) {
    var nilai = Math.floor(Math.abs(nilai)); var huruf = ["", "Satu", "Dua", "Tiga", "Empat", "Lima", "Enam", "Tujuh", "Delapan", "Sembilan", "Sepuluh", "Sebelas"];
    var temp = "";
    if (nilai < 12) { temp = " " + huruf[nilai]; } else if (nilai < 20) { temp = penyebut(nilai - 10) + " Belas"; } else if (nilai < 100) { temp = penyebut(nilai / 10) + " Puluh" + penyebut(nilai % 10); } else if (nilai < 200) { temp = " Seratus" + penyebut(nilai - 100); } else if (nilai < 1000) { temp = penyebut(nilai / 100) + " Ratus" + penyebut(nilai % 100); } else if (nilai < 2000) { temp = " Seribu" + penyebut(nilai - 1000); } else if (nilai < 1000000) { temp = penyebut(nilai / 1000) + " Ribu" + penyebut(nilai % 1000); } else if (nilai < 1000000000) { temp = penyebut(nilai / 1000000) + " Juta" + penyebut(nilai % 1000000); }
    return temp;
}

function perbaikiTanggalISO(tglStr) {
    if (!tglStr) return "";
    try {
        let d = new Date(tglStr);
        if (isNaN(d.getTime())) return tglStr; 
        let yyyy = d.getFullYear(); let mm = String(d.getMonth() + 1).padStart(2, '0'); let dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    } catch(e) { return tglStr; }
}

// ==========================================
// 1. SISTEM LOGIN (DINONAKTIFKAN / BYPASS BOLO)
// ==========================================
async function eksekusiLogin() { initApp(); }
function eksekusiLogout() { Swal.fire('Info', 'Sistem Login saat ini sedang dinonaktifkan sementara Bolo!', 'info'); }

function initApp() {
    document.getElementById('pageLogin').style.display = 'none';
    document.getElementById('appContainer').style.display = 'block';
    
    document.getElementById('displayRole').innerText = "Admin (Bypass)";
    document.getElementById('displayUser').innerText = "Halo, Admin";
    document.getElementById('tabPengaturan').style.display = 'inline-block';
    
    switchTab('generator'); muatDataArsip(); 
    
    if(localStorage.getItem('temaGLA') === 'gelap') { 
        document.body.classList.add('dark-mode'); 
        let iconTema = document.getElementById('iconTema');
        if(iconTema) { iconTema.classList.replace('fa-moon', 'fa-sun'); iconTema.style.color = '#fbbf24'; }
    }
    
    let tglSurat = document.getElementById('tglSurat');
    if(tglSurat) tglSurat.valueAsDate = new Date();
}

// ==========================================
// 2. MANAJEMEN USER 
// ==========================================
async function muatDataUser() {
    try {
        let res = await fetch(URL_GAS + "?action=get_users"); let d = await res.json();
        if(d.success) {
            databaseUsers = d.data; let tbody = document.getElementById('bodyUsers'); tbody.innerHTML = '';
            databaseUsers.forEach(u => {
                tbody.innerHTML += `<tr><td>${u.username}</td><td>${u.password}</td><td><span class="badge-status status-baru">${u.role}</span></td><td style="text-align:center;"><button class="action-btn" style="background:var(--warning);" onclick="editUser('${u.id}', '${u.username}', '${u.password}', '${u.role}')"><i class="fa-solid fa-pen"></i></button> <button class="action-btn" style="background:var(--danger);" onclick="hapusUser('${u.id}')"><i class="fa-solid fa-trash"></i></button></td></tr>`;
            });
        }
    } catch(e) {}
}

function bukaModalUser() { document.getElementById('modUserId').value = ''; document.getElementById('modUsername').value = ''; document.getElementById('modPassword').value = ''; document.getElementById('modRole').value = 'User'; document.getElementById('modalUser').classList.add('active'); }
function editUser(id, user, pass, role) { document.getElementById('modUserId').value = id; document.getElementById('modUsername').value = user; document.getElementById('modPassword').value = pass; document.getElementById('modRole').value = role; document.getElementById('modalUser').classList.add('active'); }
async function simpanUserModal() {
    let id = document.getElementById('modUserId').value; let user = document.getElementById('modUsername').value; let pass = document.getElementById('modPassword').value; let role = document.getElementById('modRole').value;
    if(!user || !pass) return Swal.fire('Ops', 'Isi username dan password', 'warning');
    Swal.fire({ title: 'Menyimpan...', didOpen: () => { Swal.showLoading() } });
    await fetch(URL_GAS, { method: 'POST', body: JSON.stringify({ action: "save_user", id, username: user, password: pass, role }) });
    Swal.fire('Berhasil', 'Data User disimpan', 'success'); document.getElementById('modalUser').classList.remove('active'); muatDataUser();
}
async function hapusUser(id) { if(confirm('Yakin hapus user ini?')) { await fetch(URL_GAS, { method: 'POST', body: JSON.stringify({ action: "delete_user", id }) }); muatDataUser(); } }

// ==========================================
// 3. LOGIKA KERANJANG & ARSIP UTAMA
// ==========================================
function cekHistoriNota() {
    let inputNota = document.getElementById('noNota').value.toLowerCase().trim(); let warningEl = document.getElementById('warningNota'); let isEditing = document.getElementById('editIdArsip').value !== "";
    let isExist = databaseArsip.some(r => r.no_nota && r.no_nota.toLowerCase().trim() === inputNota);
    warningEl.style.display = (isExist && !isEditing && inputNota !== "") ? 'block' : 'none';
}

function bukaModalProduk() { editIndex = -1; document.getElementById('modDesc').value = ''; document.getElementById('modQty').value = '1'; document.getElementById('modSatuan').value = 'Buah'; document.getElementById('modHarga').value = '60000'; document.getElementById('modalProduk').classList.add('active'); }
function simpanItemModal() {
    let desc = document.getElementById('modDesc').value; let qty = parseFloat(document.getElementById('modQty').value) || 0; let satuan = document.getElementById('modSatuan').value; let harga = parseFloat(document.getElementById('modHarga').value) || 0;
    if(!desc) { Swal.fire('Kosong', 'Deskripsi produk wajib diisi.', 'warning'); return; }
    let item = { desc, qty, satuan, harga, total: qty * harga }; 
    if (editIndex === -1) stateItems.push(item); else stateItems[editIndex] = item;
    document.getElementById('modalProduk').classList.remove('active'); renderTabelUI();
}
function editItemArray(idx) { editIndex = idx; let item = stateItems[idx]; document.getElementById('modDesc').value = item.desc; document.getElementById('modQty').value = item.qty; document.getElementById('modSatuan').value = item.satuan; document.getElementById('modHarga').value = item.harga; document.getElementById('modalProduk').classList.add('active'); }
function hapusItemArray(idx) { stateItems.splice(idx, 1); renderTabelUI(); }

function renderTabelUI() {
    let tbody = document.getElementById('tabelBodyPesanan'); tbody.innerHTML = '';
    if(stateItems.length === 0) { tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 30px; color: var(--text-muted); font-style: italic;">Keranjang kosong.</td></tr>'; } 
    else { stateItems.forEach((it, idx) => { tbody.innerHTML += `<tr><td style="font-weight:600;">${it.desc.replace(/\n/g, '<br>')}</td><td style="text-align:center;">${it.qty}</td><td style="text-align:center;">${it.satuan}</td><td style="text-align:right;">${formatRp(it.harga)}</td><td style="text-align:right; font-weight:bold;">${formatRp(it.total)}</td><td style="text-align:center;"><button class="action-btn" style="background:var(--warning);" onclick="editItemArray(${idx})"><i class="fa-solid fa-pen"></i></button> <button class="action-btn" style="background:var(--danger);" onclick="hapusItemArray(${idx})"><i class="fa-solid fa-trash"></i></button></td></tr>`; }); }
    kalkulasiTotal();
}

let hitunganTerakhir = { dpp: 0, ppn: 0, pph: 0, grandTotal: 0 };
function kalkulasiTotal() {
    let totalKotorBarang = stateItems.reduce((sum, item) => sum + item.total, 0); 
    let tipeHarga = document.querySelector('input[name="tipeHarga"]:checked').value; let pakaiPpn = document.getElementById('pakaiPPN').checked;
    let dpp = 0; let ppn = 0;
    if (tipeHarga === 'include') { if (pakaiPpn) { dpp = totalKotorBarang / 1.11; ppn = totalKotorBarang - dpp; } else { dpp = totalKotorBarang; ppn = 0; } } 
    else { dpp = totalKotorBarang; ppn = pakaiPpn ? dpp * 0.11 : 0; }
    document.getElementById('inputPph').disabled = !document.getElementById('pakaiPPH').checked;
    let pph = document.getElementById('pakaiPPH').checked ? (parseFloat(document.getElementById('inputPph').value) || 0) : 0;
    let grandTotal = dpp + ppn - pph;
    hitunganTerakhir = { dpp, ppn, pph, grandTotal };
    document.getElementById('viewDpp').value = formatRp(dpp); document.getElementById('viewPpn').value = formatRp(ppn); document.getElementById('viewGrandTotal').value = formatRp(grandTotal);
}

function kumpulkanData() {
    let alamatRaw = document.getElementById('alamatCustomer').value || '';
    let upRaw = document.getElementById('upCustomer').value || '';
    let gabunganLokasi = alamatRaw + "|||" + upRaw; 

    return {
        tanggal: document.getElementById('tglSurat').value, 
        no_kwitansi: document.getElementById('noKwitansi').value, 
        no_nota: document.getElementById('noNota').value, 
        customer: document.getElementById('customer').value, 
        kegiatan: gabunganLokasi, 
        pakai_ppn: document.getElementById('pakaiPPN').checked, 
        pakai_pph: document.getElementById('pakaiPPH').checked, 
        nominal_pph: document.getElementById('inputPph').value,
        jenis_harga: document.querySelector('input[name="tipeHarga"]:checked').value, 
        
        // TAMBAHAN: Agar terbaca saat disave
        catatan: document.getElementById('catatanTambahan').value,
        admin_pembuat: document.getElementById('adminPembuat').value,
        sales: document.getElementById('namaSales').value,
        
        items: stateItems
    };
}

async function simpanAtauUpdateDB() {
    const data = kumpulkanData();
    if(!data.customer || stateItems.length === 0) return Swal.fire('Belum Lengkap', 'Customer dan Keranjang Item wajib diisi.', 'warning');
    
    const idArsip = document.getElementById('editIdArsip').value; const action = idArsip ? 'update' : 'backup';
    Swal.fire({ title: 'Menyimpan ke Google Sheets...', didOpen: () => { Swal.showLoading() } });
    
    try {
        let payload = { action: action, data: data }; if (idArsip) payload.id = idArsip;
        await fetch(URL_GAS, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        Swal.fire('Sukses!', 'Database berhasil disimpan!', 'success');
        if (!idArsip) { document.getElementById('editIdArsip').value = "TERSIMPAN"; setUIStatus("Edit Arsip"); }
        muatDataArsip(); 
    } catch (err) { Swal.fire('Gagal', 'Terjadi kesalahan jaringan.', 'error'); }
}

async function muatDataArsip() {
    document.getElementById('bodyArsip').innerHTML = '<tr><td colspan="6" style="text-align:center; padding:50px;">Menarik data... <i class="fa-solid fa-spinner fa-spin"></i></td></tr>';
    try {
        const response = await fetch(URL_GAS + "?action=get_arsip"); 
        const res = await response.json();
        if(res.success && res.data) {
            let grouped = {};
            res.data.forEach(row => {
                let id = row.id_transaksi;
                let kegiatanAsli = row.kegiatan || '';
                let arrPisah = kegiatanAsli.split("|||");
                let d_alamat = arrPisah[0] || '';
                let d_up = arrPisah.length > 1 ? arrPisah[1] : '';

                if(!grouped[id]) { 
                    grouped[id] = { 
                        id_transaksi: id, tanggal: perbaikiTanggalISO(row.tanggal), no_nota: row.no_nota, no_kwitansi: row.no_kwitansi, 
                        customer: row.customer, alamat_asli: d_alamat, up_asli: d_up, grand_total: 0, 
                        pakai_ppn: false, pakai_pph: false, nominal_pph: 0, jenis_harga: 'exclude', 
                        
                        // TAMBAHAN: Agar data dari Google Sheet masuk ke memori aplikasi
                        catatan: row.catatan || '', admin_pembuat: row.admin_pembuat || 'BAYU', sales: row.sales || '',
                        
                        items: [] 
                    }; 
                }
                if (parseFloat(row.ppn) > 0) grouped[id].pakai_ppn = true;
                if (parseFloat(row.pph) > 0) { grouped[id].pakai_pph = true; grouped[id].nominal_pph += parseFloat(row.pph); }
                grouped[id].grand_total += parseFloat(row.total);
                grouped[id].items.push({ desc: row.nama_barang, qty: parseFloat(row.qty), satuan: row.satuan, harga: parseFloat(row.harga_satuan), total: parseFloat(row.qty) * parseFloat(row.harga_satuan) });
            });
            databaseArsip = Object.values(grouped).reverse();
            renderTabelArsip(databaseArsip);
            listCustomerDb = [...new Set(databaseArsip.map(item => item.customer))];
        }
    } catch(e) { document.getElementById('bodyArsip').innerHTML = '<tr><td colspan="6" style="text-align:center; color:red;">Data dari server diblokir CORS. Aplikasi tetap bisa dipakai untuk Generator.</td></tr>'; }
}

function renderTabelArsip(dataArray) {
    let tbody = document.getElementById('bodyArsip'); tbody.innerHTML = '';
    if(dataArray.length === 0) { tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Belum ada arsip.</td></tr>'; return; }
    dataArray.forEach((row) => {
        let listBarangHtml = row.items.map(it => `<div class="arsip-item-list"><div style="display:flex; justify-content:space-between;"><span>&bull; ${it.desc} <span style="color:var(--text-muted); font-size:0.75rem;">(${it.qty} ${it.satuan})</span></span><span style="font-weight:600;">${formatRp(it.total)}</span></div></div>`).join('');
        let teksAlamat = row.alamat_asli ? row.alamat_asli : '-';
        
        // TAMBAHAN: Menampilkan Catatan & Info Admin di UI Tabel
        let infoCatatan = row.catatan ? `<div style="font-size:0.75rem; color:var(--warning); font-weight:600; margin-top: 5px; font-style: italic;">📝 Catatan: "${row.catatan}"</div>` : '';
        
        tbody.innerHTML += `<tr>
            <td style="font-weight:600;">${row.tanggal}</td>
            <td>
                <div style="font-weight:bold;">Kwi: ${row.no_kwitansi || '-'}</div>
                <div style="font-size:0.75rem; color:var(--text-muted);">Nota: ${row.no_nota || '-'}</div>
                <div style="font-size:0.72rem; color:var(--primary); font-weight:700; margin-top:5px;"><i class="fa-solid fa-user-gear"></i> ${row.admin_pembuat}</div>
                <div style="font-size:0.72rem; color:var(--success); font-weight:700;"><i class="fa-solid fa-user-tag"></i> Sales: ${row.sales || '-'}</div>
            </td>
            <td>
                <div style="font-weight:bold; color:var(--primary);">${row.customer.toUpperCase()}</div>
                <div style="font-size:0.75rem; color:var(--text-muted); margin-top: 4px;">${teksAlamat}</div>
                ${infoCatatan}
            </td>
            <td>${listBarangHtml}</td>
            <td style="text-align:right; font-weight:bold; font-size:1.1rem; color:var(--text-heading);">${formatRp(row.grand_total)}</td>
            <td style="text-align:center; display:flex; gap:5px; flex-wrap:wrap; justify-content:center;">
                <button class="action-btn" style="background:var(--success);" onclick="copyArsip('${row.id_transaksi}')" title="Copy menjadi Nota Baru"><i class="fa-regular fa-copy"></i></button> 
                <button class="action-btn" style="background:var(--warning);" onclick="editArsip('${row.id_transaksi}')" title="Edit Data"><i class="fa-solid fa-pen"></i></button> 
                <button class="action-btn" style="background:var(--danger);" onclick="hapusArsip('${row.id_transaksi}')" title="Hapus"><i class="fa-solid fa-trash"></i></button>
            </td>
        </tr>`;
    });
}

function filterArsip() {
    let keyword = document.getElementById('searchArsip').value.toLowerCase();
    let filtered = databaseArsip.filter(r => r.customer.toLowerCase().includes(keyword) || (r.no_nota && r.no_nota.toLowerCase().includes(keyword)) || r.items.some(it => it.desc.toLowerCase().includes(keyword)));
    renderTabelArsip(filtered);
}

function setUIStatus(mode) {
    let badge = document.getElementById('badgeStatusUI'); let btn = document.getElementById('btnSimpan');
    if (mode === "Buat Baru" || mode === "Copy Baru") {
        badge.className = "badge-status status-baru"; badge.innerText = `Status: ${mode}`;
        btn.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> Simpan Database Sheet'; btn.style.background = 'var(--success)';
    } else {
        badge.className = "badge-status status-edit"; badge.innerText = `Status: ${mode}`;
        btn.innerHTML = '<i class="fa-solid fa-pen-to-square"></i> Update Perubahan Arsip'; btn.style.background = 'var(--warning)';
    }
}

// JURUS PENGAMAN FORM (Penyebab Tombol Copy Macet Tadi)
function isiFormDariArsip(d) {
    document.getElementById('tglSurat').value = d.tanggal; 
    document.getElementById('noKwitansi').value = d.no_kwitansi; 
    document.getElementById('noNota').value = d.no_nota; 
    document.getElementById('customer').value = d.customer; 
    
    let elAlamat = document.getElementById('alamatCustomer');
    if(elAlamat) elAlamat.value = d.alamat_asli || '';
    
    let elUp = document.getElementById('upCustomer');
    if(elUp) elUp.value = d.up_asli || 'Bagian Keuangan';
    
    document.getElementById('pakaiPPN').checked = d.pakai_ppn; 
    document.getElementById('pakaiPPH').checked = d.pakai_pph; 
    document.getElementById('inputPph').value = d.nominal_pph;
    if(d.jenis_harga === 'include') { document.querySelector('input[value="include"]').checked = true; } else { document.querySelector('input[value="exclude"]').checked = true; }
    
    // TAMBAHAN: Mengamankan data dari nota lama yang belum punya catatan
    let elCatatan = document.getElementById('catatanTambahan'); if(elCatatan) elCatatan.value = d.catatan || '';
    let elAdmin = document.getElementById('adminPembuat'); if(elAdmin) elAdmin.value = d.admin_pembuat || 'BAYU';
    let elSales = document.getElementById('namaSales'); if(elSales) elSales.value = d.sales || '';

    stateItems = JSON.parse(JSON.stringify(d.items)); 
}

function copyArsip(id_transaksi) { 
    let d = databaseArsip.find(x => x.id_transaksi === id_transaksi);
    if(!d) return;
    
    isiFormDariArsip(d); 
    document.getElementById('editIdArsip').value = ''; 
    setUIStatus("Copy Baru"); 
    cekHistoriNota(); 
    renderTabelUI(); 
    switchTab('generator'); 
    Swal.fire({ toast:true, position:'top-end', icon:'success', title:'Tercopy! Siap diedit jadi Nota Baru', showConfirmButton:false, timer:2500 }); 
}

function editArsip(id_transaksi) { 
    let d = databaseArsip.find(x => x.id_transaksi === id_transaksi);
    if(!d) return;
    
    isiFormDariArsip(d); 
    document.getElementById('editIdArsip').value = d.id_transaksi; 
    setUIStatus("Edit Arsip"); 
    document.getElementById('warningNota').style.display = 'none'; 
    renderTabelUI(); 
    switchTab('generator'); 
    Swal.fire({ toast:true, position:'top-end', icon:'info', title:'Data Siap Diedit!', showConfirmButton:false, timer:2000 }); 
}

async function hapusArsip(id_transaksi) {
    Swal.fire({ title: 'Yakin Hapus?', text: "Data tidak bisa dikembalikan!", icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'Ya, Hapus' }).then(async (result) => {
        if (result.isConfirmed) { 
            Swal.fire({ title: 'Menghapus...', didOpen: () => { Swal.showLoading() } }); 
            await fetch(URL_GAS, { method: 'POST', mode: 'no-cors', body: JSON.stringify({ action: "delete", id: id_transaksi }) }); 
            Swal.fire('Terhapus!', 'Baris arsip telah dihapus.', 'success'); 
            muatDataArsip(); 
        }
    });
}

// ==========================================
// FUNGSI 1: CETAK PDF / PRINT (Sudah dirapikan spasinya)
// ==========================================
function siapkanCetakLaluPrint() {
    if(stateItems.length === 0) return Swal.fire('Kosong', 'Keranjang produk tidak boleh kosong.', 'warning');
    
    document.getElementById('prKwitansi').innerText = document.getElementById('noKwitansi').value || ""; 
    document.getElementById('prCustomer').innerText = document.getElementById('customer').value; 
    document.getElementById('prLokasi').innerText = document.getElementById('alamatCustomer').value || "-";
    
    let listKwitansi = stateItems.map(it => `${it.desc} (${it.qty} ${it.satuan})`).join(', '); 
    document.getElementById('prListKwitansi').innerText = listKwitansi;
    
    let finalTerbilang = hitunganTerakhir.grandTotal; 
    document.getElementById('prTerbilang').innerText = "# " + penyebut(finalTerbilang).trim() + " Rupiah #"; 
    document.getElementById('prTotalKwitansi').innerText = formatRp(finalTerbilang) + ",-";
    
    document.getElementById('prNota').innerText = document.getElementById('noNota').value; 
    document.getElementById('prCustomerNota').innerText = document.getElementById('customer').value;
    
    // TAMBAHAN: Memunculkan Catatan di PDF
    let txtCatatan = document.getElementById('catatanTambahan').value;
    let elPrCatatan = document.getElementById('prCatatanNota');
    if (elPrCatatan) elPrCatatan.innerText = txtCatatan ? "Catatan: " + txtCatatan : "";

    let txtAlamat = document.getElementById('alamatCustomer').value;
    let txtUp = document.getElementById('upCustomer').value;
    document.getElementById('prAlamatNota').innerHTML = txtAlamat ? txtAlamat.replace(/\n/g, '<br>') : "Di Tempat";
    document.getElementById('prUpNota').innerHTML = txtUp ? `<br>Up. <b>${txtUp}</b>` : "";

    let tbodyNota = document.getElementById('prBodyNota'); let htmlNota = '';
    stateItems.forEach((it, i) => { htmlNota += `<tr><td style="text-align: center;">${i+1}</td><td><b>${it.desc.replace(/\n/g, '<br>')}</b></td><td style="text-align: center;">${it.qty}</td><td style="text-align: center;">${it.satuan}</td><td style="text-align: right;">${formatRp(it.harga)}</td><td style="text-align: right; font-weight: bold;">${formatRp(it.total)}</td></tr>`; });
    
    // PERBAIKAN: Spasi kosong tabel dikurangi dari 100px jadi 20px
    htmlNota += `<tr><td style="border-top:none; border-bottom:none; height:20px;"></td><td style="border-top:none; border-bottom:none;"></td><td style="border-top:none; border-bottom:none;"></td><td style="border-top:none; border-bottom:none;"></td><td style="border-top:none; border-bottom:none;"></td><td style="border-top:none; border-bottom:none;"></td></tr>`;
    
    let tp = hitunganTerakhir; 
    htmlNota += `<tr><td colspan="4" class="no-border"></td><td style="font-weight:bold; text-align:right;">TOTAL HARGA</td><td style="font-weight:bold; text-align:right;">${formatRp(tp.grandTotal)}</td></tr>`; 
    htmlNota += `<tr><td colspan="4" class="no-border"></td><td style="text-align:right;">DPP</td><td style="text-align:right;">${formatRp(tp.dpp)}</td></tr>`;
    if(document.getElementById('pakaiPPN').checked) { htmlNota += `<tr><td colspan="4" class="no-border"></td><td style="text-align:right;">PPN 11%</td><td style="text-align:right;">${formatRp(tp.ppn)}</td></tr>`; }
    if(document.getElementById('pakaiPPH').checked) { htmlNota += `<tr><td colspan="4" class="no-border"></td><td style="text-align:right;">PPH</td><td style="text-align:right; color:#b91c1c;">(${formatRp(tp.pph)})</td></tr>`; }
    tbodyNota.innerHTML = htmlNota;
    
    let tglInp = document.getElementById('tglSurat').value;
    if(tglInp) { 
        let parts = tglInp.split('-'); 
        let strBulan = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"][parseInt(parts[1])-1]; 
        let finalTgl = `${parts[2]} ${strBulan} ${parts[0]}`; 
        document.querySelectorAll('.prTanggal').forEach(el => el.innerText = finalTgl); 
    } else { document.querySelectorAll('.prTanggal').forEach(el => el.innerText = ""); }
    
    window.print();
}

// ==========================================
// FUNGSI 2: EXPORT WORD (Pisah Halaman & Spasi Rapi)
// ==========================================
function exportWordAsFolio() {
    if(stateItems.length === 0) return Swal.fire('Kosong', 'Keranjang produk tidak boleh kosong.', 'warning');
    
    document.getElementById('prKwitansi').innerText = document.getElementById('noKwitansi').value || ""; 
    document.getElementById('prCustomer').innerText = document.getElementById('customer').value; 
    document.getElementById('prLokasi').innerText = document.getElementById('alamatCustomer').value || "-";
    let listKwitansi = stateItems.map(it => `${it.desc} (${it.qty} ${it.satuan})`).join(', '); 
    document.getElementById('prListKwitansi').innerText = listKwitansi;
    
    let finalTerbilang = hitunganTerakhir.grandTotal; 
    document.getElementById('prTerbilang').innerText = "# " + penyebut(finalTerbilang).trim() + " Rupiah #"; 
    document.getElementById('prTotalKwitansi').innerText = formatRp(finalTerbilang) + ",-";
    document.getElementById('prNota').innerText = document.getElementById('noNota').value; 
    document.getElementById('prCustomerNota').innerText = document.getElementById('customer').value;

    let txtCatatan2 = document.getElementById('catatanTambahan').value;
    let elPrCatatan2 = document.getElementById('prCatatanNota');
    if(elPrCatatan2) elPrCatatan2.innerText = txtCatatan2 ? "Catatan: " + txtCatatan2 : "";

    let txtAlamat = document.getElementById('alamatCustomer').value;
    let txtUp = document.getElementById('upCustomer').value;
    document.getElementById('prAlamatNota').innerHTML = txtAlamat ? txtAlamat.replace(/\n/g, '<br>') : "Di Tempat";
    document.getElementById('prUpNota').innerHTML = txtUp ? `<br>Up. <b>${txtUp}</b>` : "";

    let tbodyNota = document.getElementById('prBodyNota'); let htmlNota = '';
    stateItems.forEach((it, i) => { htmlNota += `<tr><td style="text-align: center;">${i+1}</td><td><b>${it.desc.replace(/\n/g, '<br>')}</b></td><td style="text-align: center;">${it.qty}</td><td style="text-align: center;">${it.satuan}</td><td style="text-align: right;">${formatRp(it.harga)}</td><td style="text-align: right; font-weight: bold;">${formatRp(it.total)}</td></tr>`; });
    
    // PERBAIKAN: Spasi kosong tabel dikurangi dari 100px jadi 20px
    htmlNota += `<tr><td style="border-top:none; border-bottom:none; height:20px;"></td><td style="border-top:none; border-bottom:none;"></td><td style="border-top:none; border-bottom:none;"></td><td style="border-top:none; border-bottom:none;"></td><td style="border-top:none; border-bottom:none;"></td><td style="border-top:none; border-bottom:none;"></td></tr>`;
    
    let tp = hitunganTerakhir;
    htmlNota += `<tr><td colspan="4" class="no-border"></td><td style="font-weight:bold; text-align:right;">TOTAL HARGA</td><td style="font-weight:bold; text-align:right;">${formatRp(tp.grandTotal)}</td></tr>`;
    htmlNota += `<tr><td colspan="4" class="no-border"></td><td style="text-align:right;">DPP</td><td style="text-align:right;">${formatRp(tp.dpp)}</td></tr>`;
    if(document.getElementById('pakaiPPN').checked) { htmlNota += `<tr><td colspan="4" class="no-border"></td><td style="text-align:right;">PPN 11%</td><td style="text-align:right;">${formatRp(tp.ppn)}</td></tr>`; }
    if(document.getElementById('pakaiPPH').checked) { htmlNota += `<tr><td colspan="4" class="no-border"></td><td style="text-align:right;">PPH</td><td style="text-align:right; color:#b91c1c;">(${formatRp(tp.pph)})</td></tr>`; }
    tbodyNota.innerHTML = htmlNota;

    let tglInp = document.getElementById('tglSurat').value;
    if(tglInp) { 
        let parts = tglInp.split('-'); let strBulan = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"][parseInt(parts[1])-1]; 
        let finalTgl = `${parts[2]} ${strBulan} ${parts[0]}`; document.querySelectorAll('.prTanggal').forEach(el => el.innerText = finalTgl); 
    } else { document.querySelectorAll('.prTanggal').forEach(el => el.innerText = ""); }

    let areaCetak = document.getElementById('areaCetak').innerHTML;
    
    // PERBAIKAN: Pemisah halaman (Page Break) khusus yang bisa dibaca paksa oleh MS Word
    areaCetak = areaCetak.replace(/<div class="page-break"><\/div>/g, '<br clear="all" style="page-break-before:always; mso-break-type:page-break" />');

    // PERBAIKAN: Margin kertas (margin) dikurangi dari 1.0in (2.54cm) menjadi 0.5in (1.27cm) agar isinya muat & tidak berantakan
    let htmlContent = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head><meta charset='utf-8'><title>Export Word F4</title><style>@page WordSection1 { size: 8.5in 13.0in; margin: 0.5in 0.5in 0.5in 0.5in; mso-header-margin: .5in; mso-footer-margin: .5in; mso-paper-source: 0; } div.WordSection1 { page: WordSection1; } body { font-family: 'Times New Roman', Times, serif; color: black; } table { width: 100%; border-collapse: collapse; } .kop-table { border-bottom: 3px solid black; margin-bottom: 20px; padding-bottom: 10px; } .tabel-print th, .tabel-print td { border: 1pt solid black; padding: 6px 8px; font-size: 11pt; } .tabel-print th { background-color: #f2f2f2; text-align: center; font-weight: bold; } .box-terbilang { border: 3pt double black; padding: 8px 12px; font-weight: bold; font-style: italic; background-color: #f9f9f9; } .no-border { border: none !important; } td { vertical-align: top; }</style></head>
    <body><div class="WordSection1">${areaCetak}</div></body>
    </html>`;

    let blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword' });
    let url = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(htmlContent);
    let namaCustomer = document.getElementById('customer').value.trim() || 'Customer';
    let namaFile = 'Nota_Kwitansi_GLA_' + namaCustomer + '.doc';
    
    let downloadLink = document.createElement("a"); document.body.appendChild(downloadLink);
    if(navigator.msSaveOrOpenBlob) { navigator.msSaveOrOpenBlob(blob, namaFile); } else { downloadLink.href = url; downloadLink.download = namaFile; downloadLink.click(); }
    document.body.removeChild(downloadLink);
}

function kosongkanForm() { 
    document.querySelectorAll('input[type="text"]:not(#customer), textarea').forEach(el => el.value = ''); 
    document.getElementById('customer').value = ''; 
    
    let elAlamat = document.getElementById('alamatCustomer');
    if(elAlamat) elAlamat.value = ''; 
    
    let elUp = document.getElementById('upCustomer');
    if(elUp) elUp.value = 'Bagian Keuangan'; 
    
    // TAMBAHAN: Membersihkan form Catatan & mengembalikan Admin ke default
    let elCatatan = document.getElementById('catatanTambahan'); if(elCatatan) elCatatan.value = ''; 
    let elAdmin = document.getElementById('adminPembuat'); if(elAdmin) elAdmin.value = 'BAYU'; 
    let elSales = document.getElementById('namaSales'); if(elSales) elSales.value = ''; 
    
    document.getElementById('editIdArsip').value = ''; 
    stateItems = []; 
    document.querySelector('input[value="exclude"]').checked = true; 
    setUIStatus("Buat Baru"); 
    document.getElementById('warningNota').style.display = 'none'; 
    renderTabelUI(); 
}

function switchTab(target) {
    document.getElementById('pageGenerator').style.display = target === 'generator' ? 'flex' : 'none'; document.getElementById('pageArsip').style.display = target === 'arsip' ? 'flex' : 'none'; document.getElementById('pagePengaturan').style.display = target === 'pengaturan' ? 'flex' : 'none';
    document.getElementById('tabGenerator').classList.toggle('active', target === 'generator'); document.getElementById('tabArsip').classList.toggle('active', target === 'arsip'); document.getElementById('tabPengaturan').classList.toggle('active', target === 'pengaturan');
    if(target === 'arsip' && databaseArsip.length === 0) muatDataArsip();
    if(target === 'pengaturan' && databaseUsers.length === 0) muatDataUser();
}

function filterCustomer() { let input = document.getElementById('customer').value.toLowerCase(); let ul = document.getElementById('listCustomer'); ul.innerHTML = ''; if(!input) return; let filtered = listCustomerDb.filter(c => c.toLowerCase().includes(input)); filtered.forEach(cust => { ul.innerHTML += `<li onclick="pilihCustomer('${cust}')">${cust}</li>`; }); }
function pilihCustomer(val) { document.getElementById('customer').value = val; document.getElementById('listCustomer').style.display = 'none'; }
function toggleTema() { document.body.classList.toggle('dark-mode'); let icon = document.getElementById('iconTema'); if (document.body.classList.contains('dark-mode')) { icon.classList.replace('fa-moon', 'fa-sun'); icon.style.color = '#fbbf24'; localStorage.setItem('temaGLA', 'gelap'); } else { icon.classList.replace('fa-sun', 'fa-moon'); icon.style.color = 'var(--text-muted)'; localStorage.setItem('temaGLA', 'terang'); } }

window.onload = initApp;
document.addEventListener('click', function(e) { if(e.target.id !== 'customer') document.getElementById('listCustomer').style.display = 'none'; });
