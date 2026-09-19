import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  Boxes,
  Car,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  DollarSign,
  Filter,
  History,
  MoreHorizontal,
  Package,
  Plus,
  Search,
  Settings2,
  Truck,
  Wrench,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import AdminLayout from "../components/AdminLayout";

type StockStatus = "En stock" | "Stock bajo" | "Sin stock";
type MovementType = "Entrada" | "Salida" | "Ajuste";

type Product = {
  id: string;
  code: string;
  name: string;
  category: string;
  brand: string;
  stock: number;
  minStock: number;
  unit: string;
  cost: number;
  salePrice: number;
  supplier: string;
  location: string;
};

type StockMovement = {
  id: string;
  type: MovementType;
  product: string;
  quantity: number;
  date: string;
  time: string;
  reference: string;
  user: string;
};

const initialProducts: Product[] = [
  {
    id: "PRD-001",
    code: "FIL-001",
    name: "Filtro de aceite",
    category: "Filtros",
    brand: "Mann",
    stock: 24,
    minStock: 8,
    unit: "unidad",
    cost: 8500,
    salePrice: 12500,
    supplier: "Repuestos Norte",
    location: "Estante A1",
  },
  {
    id: "PRD-002",
    code: "FIL-002",
    name: "Filtro de aire",
    category: "Filtros",
    brand: "Bosch",
    stock: 17,
    minStock: 6,
    unit: "unidad",
    cost: 9200,
    salePrice: 14500,
    supplier: "Autopartes Tucumán",
    location: "Estante A2",
  },
  {
    id: "PRD-003",
    code: "ACE-001",
    name: "Aceite 5W-30 sintético",
    category: "Lubricantes",
    brand: "Castrol",
    stock: 38,
    minStock: 10,
    unit: "litro",
    cost: 11200,
    salePrice: 16800,
    supplier: "LubriCentro",
    location: "Sector B1",
  },
  {
    id: "PRD-004",
    code: "ACE-002",
    name: "Aceite 10W-40 semisintético",
    category: "Lubricantes",
    brand: "Shell",
    stock: 9,
    minStock: 12,
    unit: "litro",
    cost: 8900,
    salePrice: 13900,
    supplier: "LubriCentro",
    location: "Sector B1",
  },
  {
    id: "PRD-005",
    code: "PAS-001",
    name: "Pastillas de freno delanteras",
    category: "Frenos",
    brand: "Fras-le",
    stock: 4,
    minStock: 5,
    unit: "juego",
    cost: 28500,
    salePrice: 42500,
    supplier: "Frenos del Norte",
    location: "Estante C1",
  },
  {
    id: "PRD-006",
    code: "BUJ-001",
    name: "Bujía de encendido",
    category: "Motor",
    brand: "NGK",
    stock: 42,
    minStock: 12,
    unit: "unidad",
    cost: 5400,
    salePrice: 8200,
    supplier: "Autopartes Tucumán",
    location: "Estante D1",
  },
  {
    id: "PRD-007",
    code: "BAT-001",
    name: "Batería 12V 65Ah",
    category: "Electricidad",
    brand: "Willard",
    stock: 3,
    minStock: 4,
    unit: "unidad",
    cost: 124000,
    salePrice: 168000,
    supplier: "Baterías Centro",
    location: "Sector E1",
  },
  {
    id: "PRD-008",
    code: "REF-001",
    name: "Refrigerante 1L",
    category: "Fluidos",
    brand: "Bosch",
    stock: 28,
    minStock: 10,
    unit: "unidad",
    cost: 6200,
    salePrice: 9500,
    supplier: "LubriCentro",
    location: "Sector B2",
  },
  {
    id: "PRD-009",
    code: "COR-001",
    name: "Correa de distribución",
    category: "Motor",
    brand: "Gates",
    stock: 7,
    minStock: 5,
    unit: "unidad",
    cost: 38600,
    salePrice: 57500,
    supplier: "Repuestos Norte",
    location: "Estante D2",
  },
  {
    id: "PRD-010",
    code: "LUB-001",
    name: "Lubricante multipropósito",
    category: "Lubricantes",
    brand: "WD-40",
    stock: 5,
    minStock: 8,
    unit: "unidad",
    cost: 7800,
    salePrice: 11500,
    supplier: "Autopartes Tucumán",
    location: "Sector B3",
  },
];

const initialMovements: StockMovement[] = [
  {
    id: "MOV-001",
    type: "Entrada",
    product: "Filtro de aceite",
    quantity: 12,
    date: "18/09/2026",
    time: "10:42",
    reference: "Compra #C-1042",
    user: "Administrador",
  },
  {
    id: "MOV-002",
    type: "Salida",
    product: "Aceite 5W-30 sintético",
    quantity: 5,
    date: "18/09/2026",
    time: "09:35",
    reference: "Turno #T-006",
    user: "Martín López",
  },
  {
    id: "MOV-003",
    type: "Salida",
    product: "Pastillas de freno delanteras",
    quantity: 1,
    date: "18/09/2026",
    time: "09:12",
    reference: "Turno #T-004",
    user: "Martín López",
  },
  {
    id: "MOV-004",
    type: "Entrada",
    product: "Bujía de encendido",
    quantity: 24,
    date: "17/09/2026",
    time: "16:28",
    reference: "Compra #C-1039",
    user: "Administrador",
  },
  {
    id: "MOV-005",
    type: "Salida",
    product: "Refrigerante 1L",
    quantity: 3,
    date: "17/09/2026",
    time: "15:44",
    reference: "Turno #T-003",
    user: "Carlos Medina",
  },
  {
    id: "MOV-006",
    type: "Ajuste",
    product: "Batería 12V 65Ah",
    quantity: -1,
    date: "17/09/2026",
    time: "11:20",
    reference: "Ajuste de inventario",
    user: "Administrador",
  },
];

const categories = [
  "Todas",
  "Filtros",
  "Lubricantes",
  "Frenos",
  "Motor",
  "Electricidad",
  "Fluidos",
];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value);

function getStockStatus(product: Product): StockStatus {
  if (product.stock === 0) return "Sin stock";
  if (product.stock <= product.minStock) return "Stock bajo";
  return "En stock";
}

function Inventario() {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [movements, setMovements] =
    useState<StockMovement[]>(initialMovements);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("Todas");
  const [stockFilter, setStockFilter] = useState<"Todos" | StockStatus>(
    "Todos",
  );

  const [showNewProduct, setShowNewProduct] = useState(false);
  const [showMovement, setShowMovement] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(
    null,
  );

  const [newProduct, setNewProduct] = useState({
    name: "",
    code: "",
    category: "Filtros",
    brand: "",
    stock: "",
    minStock: "",
    unit: "unidad",
    cost: "",
    salePrice: "",
    supplier: "",
    location: "",
  });

  const [movement, setMovement] = useState({
    productId: "",
    type: "Entrada" as MovementType,
    quantity: "",
    reference: "",
  });

  const totalProducts = products.length;

  const totalUnits = products.reduce((acc, product) => acc + product.stock, 0);

  const inventoryValue = products.reduce(
    (acc, product) => acc + product.stock * product.cost,
    0,
  );

  const lowStockProducts = products.filter(
    (product) => getStockStatus(product) === "Stock bajo",
  );

  const outOfStockProducts = products.filter(
    (product) => getStockStatus(product) === "Sin stock",
  );

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const searchValue = search.toLowerCase();

      const matchesSearch =
        product.name.toLowerCase().includes(searchValue) ||
        product.code.toLowerCase().includes(searchValue) ||
        product.brand.toLowerCase().includes(searchValue);

      const matchesCategory =
        categoryFilter === "Todas" || product.category === categoryFilter;

      const matchesStock =
        stockFilter === "Todos" || getStockStatus(product) === stockFilter;

      return matchesSearch && matchesCategory && matchesStock;
    });
  }, [products, search, categoryFilter, stockFilter]);

  const handleCreateProduct = () => {
    if (!newProduct.name || !newProduct.code) return;

    const product: Product = {
      id: `PRD-${String(products.length + 1).padStart(3, "0")}`,
      code: newProduct.code,
      name: newProduct.name,
      category: newProduct.category,
      brand: newProduct.brand,
      stock: Number(newProduct.stock) || 0,
      minStock: Number(newProduct.minStock) || 0,
      unit: newProduct.unit,
      cost: Number(newProduct.cost) || 0,
      salePrice: Number(newProduct.salePrice) || 0,
      supplier: newProduct.supplier,
      location: newProduct.location,
    };

    setProducts((current) => [product, ...current]);

    setNewProduct({
      name: "",
      code: "",
      category: "Filtros",
      brand: "",
      stock: "",
      minStock: "",
      unit: "unidad",
      cost: "",
      salePrice: "",
      supplier: "",
      location: "",
    });

    setShowNewProduct(false);
  };

  const handleStockMovement = () => {
    if (!movement.productId || !movement.quantity) return;

    const quantity = Number(movement.quantity);

    if (!quantity || quantity <= 0) return;

    const selected = products.find(
      (product) => product.id === movement.productId,
    );

    if (!selected) return;

    let difference = quantity;

    if (movement.type === "Salida") {
      difference = -quantity;
    }

    if (movement.type === "Ajuste") {
      difference = quantity;
    }

    setProducts((current) =>
      current.map((product) =>
        product.id === selected.id
          ? {
              ...product,
              stock: Math.max(0, product.stock + difference),
            }
          : product,
      ),
    );

    const newMovement: StockMovement = {
      id: `MOV-${String(movements.length + 1).padStart(3, "0")}`,
      type: movement.type,
      product: selected.name,
      quantity:
        movement.type === "Salida"
          ? -quantity
          : movement.type === "Ajuste"
            ? difference
            : quantity,
      date: "18/09/2026",
      time: "12:05",
      reference: movement.reference || "Movimiento manual",
      user: "Administrador",
    };

    setMovements((current) => [newMovement, ...current]);

    setMovement({
      productId: "",
      type: "Entrada",
      quantity: "",
      reference: "",
    });

    setShowMovement(false);
  };

  return (
    <AdminLayout>
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {/* HEADER */}
        <div className="mb-8 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-blue-600">
              <Package className="h-4 w-4" />
              Control de inventario
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-slate-950">
              Inventario
            </h1>

            <p className="mt-2 max-w-2xl text-sm text-slate-500">
              Controlá repuestos, insumos y movimientos de stock del taller
              desde un solo lugar.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setShowMovement(true)}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
            >
              <ArrowUpRight className="h-4 w-4" />
              Movimiento
            </button>

            <button
              onClick={() => setShowNewProduct(true)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Nuevo producto
            </button>
          </div>
        </div>

        {/* ALERT */}
        {lowStockProducts.length > 0 && (
          <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                <AlertTriangle className="h-5 w-5" />
              </div>

              <div>
                <p className="text-sm font-bold text-amber-900">
                  Hay productos que necesitan reposición
                </p>

                <p className="mt-1 text-xs text-amber-700">
                  {lowStockProducts.length} productos están por debajo del
                  stock mínimo
                  {outOfStockProducts.length > 0 &&
                    ` y ${outOfStockProducts.length} sin stock`}
                  .
                </p>
              </div>
            </div>

            <button
              onClick={() => setStockFilter("Stock bajo")}
              className="rounded-lg border border-amber-200 bg-white px-3 py-2 text-xs font-bold text-amber-800 transition hover:bg-amber-100"
            >
              Ver productos
            </button>
          </div>
        )}

        {/* STATS */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Boxes className="h-5 w-5" />
              </div>

              <span className="text-xs font-semibold text-emerald-600">
                +8 este mes
              </span>
            </div>

            <p className="text-sm font-medium text-slate-500">
              Productos registrados
            </p>

            <p className="mt-1 text-2xl font-bold text-slate-950">
              {totalProducts}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <Package className="h-5 w-5" />
              </div>

              <span className="text-xs font-semibold text-slate-400">
                Unidades
              </span>
            </div>

            <p className="text-sm font-medium text-slate-500">
              Unidades en stock
            </p>

            <p className="mt-1 text-2xl font-bold text-slate-950">
              {totalUnits.toLocaleString("es-AR")}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <DollarSign className="h-5 w-5" />
              </div>

              <span className="text-xs font-semibold text-slate-400">
                Costo actual
              </span>
            </div>

            <p className="text-sm font-medium text-slate-500">
              Valor del inventario
            </p>

            <p className="mt-1 text-2xl font-bold text-slate-950">
              {formatCurrency(inventoryValue)}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <AlertTriangle className="h-5 w-5" />
              </div>

              <span className="text-xs font-semibold text-amber-600">
                Atención
              </span>
            </div>

            <p className="text-sm font-medium text-slate-500">
              Stock para reponer
            </p>

            <p className="mt-1 text-2xl font-bold text-slate-950">
              {lowStockProducts.length}
            </p>
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <section className="min-w-0 rounded-2xl border border-slate-200 bg-white shadow-sm">
            {/* TABLE HEADER */}
            <div className="border-b border-slate-100 p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-950">
                    Productos
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    Administrá las existencias y valores de cada producto.
                  </p>
                </div>

                <button
                  onClick={() => setShowFilters((current) => !current)}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-50"
                >
                  <Filter className="h-4 w-4" />
                  Filtros
                  <ChevronDown
                    className={`h-3.5 w-3.5 transition ${
                      showFilters ? "rotate-180" : ""
                    }`}
                  />
                </button>
              </div>

              <div className="mt-5 flex flex-col gap-3 lg:flex-row">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Buscar por producto, código o marca..."
                    className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <select
                  value={categoryFilter}
                  onChange={(event) => setCategoryFilter(event.target.value)}
                  className="h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-700 outline-none focus:border-blue-500"
                >
                  {categories.map((category) => (
                    <option key={category}>{category}</option>
                  ))}
                </select>

                {showFilters && (
                  <select
                    value={stockFilter}
                    onChange={(event) =>
                      setStockFilter(
                        event.target.value as "Todos" | StockStatus,
                      )
                    }
                    className="h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-700 outline-none focus:border-blue-500"
                  >
                    <option value="Todos">Todos los estados</option>
                    <option value="En stock">En stock</option>
                    <option value="Stock bajo">Stock bajo</option>
                    <option value="Sin stock">Sin stock</option>
                  </select>
                )}
              </div>
            </div>

            {/* TABLE */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[920px] text-left">
                <thead className="border-b border-slate-100 bg-slate-50/70">
                  <tr>
                    <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Producto
                    </th>

                    <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Categoría
                    </th>

                    <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Stock
                    </th>

                    <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Costo
                    </th>

                    <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Precio venta
                    </th>

                    <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Ubicación
                    </th>

                    <th className="px-5 py-3" />
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.map((product) => {
                    const status = getStockStatus(product);

                    return (
                      <tr
                        key={product.id}
                        className="group transition hover:bg-slate-50/70"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                              <Wrench className="h-4 w-4" />
                            </div>

                            <div className="min-w-0">
                              <p className="truncate text-sm font-bold text-slate-800">
                                {product.name}
                              </p>

                              <p className="mt-0.5 text-xs text-slate-400">
                                {product.code} · {product.brand}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <span className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-600">
                            {product.category}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <div className="min-w-[120px]">
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-sm font-bold text-slate-800">
                                {product.stock}
                              </span>

                              <span
                                className={`text-[11px] font-bold ${
                                  status === "En stock"
                                    ? "text-emerald-600"
                                    : status === "Stock bajo"
                                      ? "text-amber-600"
                                      : "text-red-600"
                                }`}
                              >
                                {status}
                              </span>
                            </div>

                            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                              <div
                                className={`h-full rounded-full ${
                                  status === "En stock"
                                    ? "bg-emerald-500"
                                    : status === "Stock bajo"
                                      ? "bg-amber-500"
                                      : "bg-red-500"
                                }`}
                                style={{
                                  width: `${Math.min(
                                    100,
                                    product.minStock > 0
                                      ? (product.stock /
                                          (product.minStock * 3)) *
                                          100
                                      : 100,
                                  )}%`,
                                }}
                              />
                            </div>

                            <p className="mt-1 text-[10px] text-slate-400">
                              Mínimo: {product.minStock}
                            </p>
                          </div>
                        </td>

                        <td className="px-5 py-4 text-sm font-semibold text-slate-700">
                          {formatCurrency(product.cost)}
                        </td>

                        <td className="px-5 py-4">
                          <div>
                            <p className="text-sm font-bold text-slate-800">
                              {formatCurrency(product.salePrice)}
                            </p>

                            <p className="mt-0.5 text-[10px] font-semibold text-emerald-600">
                              Margen{" "}
                              {Math.round(
                                ((product.salePrice - product.cost) /
                                  product.salePrice) *
                                  100,
                              )}
                              %
                            </p>
                          </div>
                        </td>

                        <td className="px-5 py-4 text-xs font-medium text-slate-500">
                          {product.location}
                        </td>

                        <td className="px-5 py-4">
                          <button
                            onClick={() => setSelectedProduct(product)}
                            className="rounded-lg p-2 text-slate-400 opacity-70 transition hover:bg-slate-100 hover:text-slate-700 group-hover:opacity-100"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filteredProducts.length === 0 && (
              <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                  <Package className="h-6 w-6" />
                </div>

                <h3 className="mt-4 text-sm font-bold text-slate-800">
                  No encontramos productos
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                  Probá cambiando la búsqueda o los filtros.
                </p>
              </div>
            )}

            {/* PAGINATION */}
            <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4">
              <p className="text-xs font-medium text-slate-500">
                Mostrando{" "}
                <span className="font-bold text-slate-700">
                  {filteredProducts.length}
                </span>{" "}
                de{" "}
                <span className="font-bold text-slate-700">
                  {products.length}
                </span>{" "}
                productos
              </p>

              <div className="flex items-center gap-1">
                <button className="rounded-lg p-2 text-slate-400 hover:bg-slate-100">
                  <ChevronLeft className="h-4 w-4" />
                </button>

                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-xs font-bold text-white">
                  1
                </span>

                <button className="rounded-lg p-2 text-slate-400 hover:bg-slate-100">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </section>

          {/* RIGHT COLUMN */}
          <aside className="space-y-6">
            {/* LOW STOCK */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 p-5">
                <div>
                  <h2 className="text-sm font-bold text-slate-950">
                    Reposición
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    Productos que requieren atención.
                  </p>
                </div>

                <AlertTriangle className="h-5 w-5 text-amber-500" />
              </div>

              <div className="divide-y divide-slate-100">
                {lowStockProducts.slice(0, 5).map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between gap-3 p-4"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-slate-800">
                        {product.name}
                      </p>

                      <p className="mt-1 text-[11px] text-slate-400">
                        Mínimo: {product.minStock}
                      </p>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="text-sm font-bold text-amber-600">
                        {product.stock}
                      </p>

                      <p className="text-[10px] font-semibold text-slate-400">
                        disponibles
                      </p>
                    </div>
                  </div>
                ))}

                {lowStockProducts.length === 0 && (
                  <div className="p-6 text-center">
                    <p className="text-xs font-semibold text-emerald-600">
                      Todo el stock está en niveles correctos.
                    </p>
                  </div>
                )}
              </div>

              {lowStockProducts.length > 5 && (
                <button
                  onClick={() => setStockFilter("Stock bajo")}
                  className="w-full border-t border-slate-100 px-4 py-3 text-xs font-bold text-blue-600 transition hover:bg-slate-50"
                >
                  Ver todos
                </button>
              )}
            </div>

            {/* MOVEMENTS */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 p-5">
                <div>
                  <h2 className="text-sm font-bold text-slate-950">
                    Últimos movimientos
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    Actividad reciente del inventario.
                  </p>
                </div>

                <History className="h-5 w-5 text-slate-400" />
              </div>

              <div className="divide-y divide-slate-100">
                {movements.slice(0, 5).map((item) => (
                  <div key={item.id} className="p-4">
                    <div className="flex items-start gap-3">
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                          item.type === "Entrada"
                            ? "bg-emerald-50 text-emerald-600"
                            : item.type === "Salida"
                              ? "bg-red-50 text-red-600"
                              : "bg-blue-50 text-blue-600"
                        }`}
                      >
                        {item.type === "Entrada" ? (
                          <ArrowDownLeft className="h-4 w-4" />
                        ) : item.type === "Salida" ? (
                          <ArrowUpRight className="h-4 w-4" />
                        ) : (
                          <Settings2 className="h-4 w-4" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="truncate text-xs font-bold text-slate-800">
                            {item.product}
                          </p>

                          <span
                            className={`shrink-0 text-xs font-bold ${
                              item.quantity > 0
                                ? "text-emerald-600"
                                : "text-red-600"
                            }`}
                          >
                            {item.quantity > 0 ? "+" : ""}
                            {item.quantity}
                          </span>
                        </div>

                        <p className="mt-1 text-[10px] text-slate-400">
                          {item.reference}
                        </p>

                        <p className="mt-1 text-[10px] text-slate-400">
                          {item.date} · {item.time}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button className="flex w-full items-center justify-center gap-2 border-t border-slate-100 px-4 py-3 text-xs font-bold text-blue-600 transition hover:bg-slate-50">
                <ClipboardList className="h-3.5 w-3.5" />
                Ver historial completo
              </button>
            </div>

            {/* QUICK ACTIONS */}
            <div className="rounded-2xl bg-slate-950 p-5 text-white shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Acciones rápidas
              </p>

              <div className="mt-4 space-y-2">
                <button
                  onClick={() => setShowNewProduct(true)}
                  className="flex w-full items-center gap-3 rounded-xl bg-white/5 px-3 py-3 text-left transition hover:bg-white/10"
                >
                  <Plus className="h-4 w-4 text-blue-400" />

                  <div>
                    <p className="text-xs font-bold">Agregar producto</p>
                    <p className="mt-0.5 text-[10px] text-slate-400">
                      Registrar un nuevo artículo
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => setShowMovement(true)}
                  className="flex w-full items-center gap-3 rounded-xl bg-white/5 px-3 py-3 text-left transition hover:bg-white/10"
                >
                  <History className="h-4 w-4 text-emerald-400" />

                  <div>
                    <p className="text-xs font-bold">Registrar movimiento</p>
                    <p className="mt-0.5 text-[10px] text-slate-400">
                      Entrada, salida o ajuste
                    </p>
                  </div>
                </button>

                <button className="flex w-full items-center gap-3 rounded-xl bg-white/5 px-3 py-3 text-left transition hover:bg-white/10">
                  <Truck className="h-4 w-4 text-amber-400" />

                  <div>
                    <p className="text-xs font-bold">Proveedores</p>
                    <p className="mt-0.5 text-[10px] text-slate-400">
                      Gestionar proveedores
                    </p>
                  </div>
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* NEW PRODUCT MODAL */}
      {showNewProduct && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <h2 className="text-lg font-bold text-slate-950">
                  Nuevo producto
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Registrá un repuesto o insumo del taller.
                </p>
              </div>

              <button
                onClick={() => setShowNewProduct(false)}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-5 p-6 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-2 block text-xs font-bold text-slate-600">
                  Nombre del producto
                </label>

                <input
                  value={newProduct.name}
                  onChange={(event) =>
                    setNewProduct((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  placeholder="Ej. Filtro de aceite"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold text-slate-600">
                  Código
                </label>

                <input
                  value={newProduct.code}
                  onChange={(event) =>
                    setNewProduct((current) => ({
                      ...current,
                      code: event.target.value,
                    }))
                  }
                  placeholder="FIL-003"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold text-slate-600">
                  Marca
                </label>

                <input
                  value={newProduct.brand}
                  onChange={(event) =>
                    setNewProduct((current) => ({
                      ...current,
                      brand: event.target.value,
                    }))
                  }
                  placeholder="Ej. Bosch"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold text-slate-600">
                  Categoría
                </label>

                <select
                  value={newProduct.category}
                  onChange={(event) =>
                    setNewProduct((current) => ({
                      ...current,
                      category: event.target.value,
                    }))
                  }
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-blue-500"
                >
                  {categories
                    .filter((category) => category !== "Todas")
                    .map((category) => (
                      <option key={category}>{category}</option>
                    ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold text-slate-600">
                  Unidad
                </label>

                <select
                  value={newProduct.unit}
                  onChange={(event) =>
                    setNewProduct((current) => ({
                      ...current,
                      unit: event.target.value,
                    }))
                  }
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-blue-500"
                >
                  <option>unidad</option>
                  <option>litro</option>
                  <option>juego</option>
                  <option>metro</option>
                  <option>kilogramo</option>
                  <option>caja</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold text-slate-600">
                  Stock inicial
                </label>

                <input
                  type="number"
                  value={newProduct.stock}
                  onChange={(event) =>
                    setNewProduct((current) => ({
                      ...current,
                      stock: event.target.value,
                    }))
                  }
                  placeholder="0"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold text-slate-600">
                  Stock mínimo
                </label>

                <input
                  type="number"
                  value={newProduct.minStock}
                  onChange={(event) =>
                    setNewProduct((current) => ({
                      ...current,
                      minStock: event.target.value,
                    }))
                  }
                  placeholder="5"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold text-slate-600">
                  Costo unitario
                </label>

                <input
                  type="number"
                  value={newProduct.cost}
                  onChange={(event) =>
                    setNewProduct((current) => ({
                      ...current,
                      cost: event.target.value,
                    }))
                  }
                  placeholder="0"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold text-slate-600">
                  Precio de venta
                </label>

                <input
                  type="number"
                  value={newProduct.salePrice}
                  onChange={(event) =>
                    setNewProduct((current) => ({
                      ...current,
                      salePrice: event.target.value,
                    }))
                  }
                  placeholder="0"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold text-slate-600">
                  Proveedor
                </label>

                <input
                  value={newProduct.supplier}
                  onChange={(event) =>
                    setNewProduct((current) => ({
                      ...current,
                      supplier: event.target.value,
                    }))
                  }
                  placeholder="Ej. Repuestos Norte"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold text-slate-600">
                  Ubicación
                </label>

                <input
                  value={newProduct.location}
                  onChange={(event) =>
                    setNewProduct((current) => ({
                      ...current,
                      location: event.target.value,
                    }))
                  }
                  placeholder="Ej. Estante A1"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50/70 px-6 py-4">
              <button
                onClick={() => setShowNewProduct(false)}
                className="rounded-xl px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-white"
              >
                Cancelar
              </button>

              <button
                onClick={handleCreateProduct}
                className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700"
              >
                Guardar producto
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STOCK MOVEMENT MODAL */}
      {showMovement && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <h2 className="text-lg font-bold text-slate-950">
                  Movimiento de stock
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Registrá una entrada, salida o ajuste.
                </p>
              </div>

              <button
                onClick={() => setShowMovement(false)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5 p-6">
              <div>
                <label className="mb-2 block text-xs font-bold text-slate-600">
                  Producto
                </label>

                <select
                  value={movement.productId}
                  onChange={(event) =>
                    setMovement((current) => ({
                      ...current,
                      productId: event.target.value,
                    }))
                  }
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-blue-500"
                >
                  <option value="">Seleccionar producto...</option>

                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} — Stock: {product.stock}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold text-slate-600">
                  Tipo de movimiento
                </label>

                <div className="grid grid-cols-3 gap-2">
                  {(["Entrada", "Salida", "Ajuste"] as MovementType[]).map(
                    (type) => (
                      <button
                        key={type}
                        onClick={() =>
                          setMovement((current) => ({
                            ...current,
                            type,
                          }))
                        }
                        className={`rounded-xl border px-3 py-3 text-xs font-bold transition ${
                          movement.type === type
                            ? "border-blue-600 bg-blue-50 text-blue-700"
                            : "border-slate-200 text-slate-500 hover:bg-slate-50"
                        }`}
                      >
                        {type}
                      </button>
                    ),
                  )}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold text-slate-600">
                  Cantidad
                </label>

                <input
                  type="number"
                  min="1"
                  value={movement.quantity}
                  onChange={(event) =>
                    setMovement((current) => ({
                      ...current,
                      quantity: event.target.value,
                    }))
                  }
                  placeholder="0"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold text-slate-600">
                  Referencia
                </label>

                <input
                  value={movement.reference}
                  onChange={(event) =>
                    setMovement((current) => ({
                      ...current,
                      reference: event.target.value,
                    }))
                  }
                  placeholder="Ej. Compra #C-1045 / Turno #T-009"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50/70 px-6 py-4">
              <button
                onClick={() => setShowMovement(false)}
                className="rounded-xl px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-white"
              >
                Cancelar
              </button>

              <button
                onClick={handleStockMovement}
                className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700"
              >
                Registrar movimiento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRODUCT DETAIL */}
      {selectedProduct && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
                  Detalle del producto
                </p>

                <h2 className="mt-1 text-lg font-bold text-slate-950">
                  {selectedProduct.name}
                </h2>
              </div>

              <button
                onClick={() => setSelectedProduct(null)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 p-6">
              <div className="rounded-xl bg-slate-50 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-slate-500 shadow-sm">
                    <Car className="h-5 w-5" />
                  </div>

                  <div>
                    <p className="text-sm font-bold text-slate-800">
                      {selectedProduct.brand}
                    </p>

                    <p className="text-xs text-slate-400">
                      {selectedProduct.code}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-slate-100 p-4">
                  <p className="text-[10px] font-bold uppercase text-slate-400">
                    Stock actual
                  </p>

                  <p className="mt-1 text-xl font-bold text-slate-950">
                    {selectedProduct.stock}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-100 p-4">
                  <p className="text-[10px] font-bold uppercase text-slate-400">
                    Stock mínimo
                  </p>

                  <p className="mt-1 text-xl font-bold text-slate-950">
                    {selectedProduct.minStock}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-100 p-4">
                  <p className="text-[10px] font-bold uppercase text-slate-400">
                    Costo
                  </p>

                  <p className="mt-1 text-sm font-bold text-slate-950">
                    {formatCurrency(selectedProduct.cost)}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-100 p-4">
                  <p className="text-[10px] font-bold uppercase text-slate-400">
                    Venta
                  </p>

                  <p className="mt-1 text-sm font-bold text-slate-950">
                    {formatCurrency(selectedProduct.salePrice)}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-slate-100 p-4">
                <p className="text-[10px] font-bold uppercase text-slate-400">
                  Proveedor
                </p>

                <p className="mt-1 text-sm font-semibold text-slate-700">
                  {selectedProduct.supplier || "Sin proveedor"}
                </p>

                <p className="mt-3 text-[10px] font-bold uppercase text-slate-400">
                  Ubicación
                </p>

                <p className="mt-1 text-sm font-semibold text-slate-700">
                  {selectedProduct.location || "Sin ubicación"}
                </p>
              </div>
            </div>

            <div className="flex justify-end border-t border-slate-100 bg-slate-50/70 px-6 py-4">
              <button
                onClick={() => {
                  setSelectedProduct(null);
                  setMovement({
                    productId: selectedProduct.id,
                    type: "Entrada",
                    quantity: "",
                    reference: "",
                  });
                  setShowMovement(true);
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700"
              >
                <Package className="h-4 w-4" />
                Registrar movimiento
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

export default Inventario;