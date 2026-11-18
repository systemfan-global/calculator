/* Cơ sở dữ liệu vật liệu. rho = khối lượng riêng (kg/m³). Thêm vật liệu: thêm 1 dòng. */
const MATERIALS = [
  { id: 'carbon', name: 'Thép carbon', rho: 7850 },
  { id: 'ss304',  name: 'Inox 304', rho: 7930 },
  { id: 'ss316',  name: 'Inox 316', rho: 8000 },
  { id: 'galv',   name: 'Thép mạ kẽm (bỏ qua lớp kẽm)', rho: 7850 },
  { id: 'al',     name: 'Nhôm', rho: 2700 },
  { id: 'cu',     name: 'Đồng', rho: 8960 },
  { id: 'custom', name: 'Tùy chọn (nhập khối lượng riêng)', rho: null }
];
