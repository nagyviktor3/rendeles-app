import React, { useState, useMemo, useRef } from 'react';
import { 
  Home, 
  ShoppingCart, 
  Package, 
  History, 
  Plus, 
  DollarSign, 
  TrendingUp, 
  Hash,
  X,
  Check,
  Handshake,
  Bot,
  Sparkles,
  Loader2,
  ArrowRight,
  Trash2,
  Box,
  Edit,
  ShoppingCart as CartIcon,
  BarChart2,
  Maximize2
} from 'lucide-react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, AreaChart, Area, Legend } from 'recharts';

export default function OrderManager() {
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const [inventory, setInventory] = useState([
    { id: 1, name: 'Vape - 8', brand: 'Vape', variant: '8', quantity: 1, buyPrice: 5800 },
    { id: 2, name: 'Vape - 6', brand: 'Vape', variant: '6', quantity: 1, buyPrice: 5800 },
    { id: 3, name: 'Vape - 3', brand: 'Vape', variant: '3', quantity: 2, buyPrice: 5500 },
    { id: 4, name: 'Vape - 10', brand: 'Vape', variant: '10', quantity: 2, buyPrice: 5500 },
    { id: 5, name: 'Vape - 2', brand: 'Vape', variant: '2', quantity: 2, buyPrice: 5500 },
    { id: 6, name: 'Vape - 9', brand: 'Vape', variant: '9', quantity: 2, buyPrice: 5500 },
    { id: 7, name: 'Vape - 1', brand: 'Vape', variant: '1', quantity: 2, buyPrice: 5500 },
    { id: 8, name: 'Vape - 4', brand: 'Vape', variant: '4', quantity: 2, buyPrice: 5500 },
    { id: 9, name: 'Vape - 7', brand: 'Vape', variant: '7', quantity: 2, buyPrice: 5500 },
    { id: 10, name: 'Vape - 8', brand: 'Vape', variant: '8', quantity: 3, buyPrice: 5500 },
  ]);

  const [pendingOrders, setPendingOrders] = useState([]);
  const [historyItems, setHistoryItems] = useState([]);

  // Új rendelés varázsló
  const [smartInput, setSmartInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [newOrder, setNewOrder] = useState({ customerName: '', items: [] });
  const [orderWizard, setOrderWizard] = useState({ brand: 'Vape', variant: '' });

  // Készlet varázsló
  const [invWizard, setInvWizard] = useState({ isOpen: false, step: 'brand', brand: 'Vape', variant: '', items: [], price: '' });

  // Átvétel (Beszerzés) varázsló
  const [buyWizard, setBuyWizard] = useState({ brand: 'Vape', currentVariant: '', boughtItems: [], step: 'variants', price: '' });
  const [pickupMode, setPickupMode] = useState('buy');

  // Eladás varázsló
  const [sellWizard, setSellWizard] = useState({ isOpen: false, orderId: null, price: '' });

  // Történet (Múltbéli) varázsló
  const [historyWizard, setHistoryWizard] = useState({ isOpen: false, step: 'variants', brand: 'Vape', currentVariant: '', items: [], buyPrice: '', sellPrice: '', date: new Date().toISOString().split('T')[0] });

  // Megtekintések állapota
  const [editingOrderId, setEditingOrderId] = useState(null);
  const [showChartsModal, setShowChartsModal] = useState(false);

  const lastXClickRef = useRef({ time: 0, variantWasEmpty: false, type: '' });

  // Készlet és rendelések szinkronizáló motorja
  const recalculateOrdersWithInventory = (orders, inv) => {
    let stockMap = {};
    inv.forEach(item => {
      let key = `${item.brand}_${item.variant}`;
      stockMap[key] = (stockMap[key] || 0) + item.quantity;
    });

    return orders.map(order => {
      let isReady = true;
      let newItems = order.items.map(item => {
        let key = `${item.brand}_${item.variant}`;
        let sessionAlloc = item.sessionAllocated || 0; 
        let needFromInventory = Math.max(0, item.quantity - sessionAlloc);
        let available = stockMap[key] || 0;
        let allocateFromInv = Math.min(needFromInventory, available);
        
        if (stockMap[key]) stockMap[key] -= allocateFromInv;

        let totalAllocated = sessionAlloc + allocateFromInv;
        let missing = item.quantity - totalAllocated;
        if (missing > 0) isReady = false;

        let buyPrice = item.buyPrice;
        if (allocateFromInv > 0 && (!buyPrice || buyPrice === 0)) {
          let invItem = inv.find(i => i.brand === item.brand && i.variant === item.variant && i.quantity > 0);
          if (invItem) buyPrice = invItem.buyPrice;
        }

        return { ...item, allocated: totalAllocated, missing, buyPrice };
      });
      return { ...order, items: newItems, status: isReady ? 'ready' : 'pending' };
    });
  };

  const handleTabChange = (tab) => {
    setPendingOrders(prev => recalculateOrdersWithInventory(prev, inventory));
    setActiveTab(tab);
  };

  const handleInventoryChange = (newInv) => {
    setInventory(newInv);
    setPendingOrders(prev => recalculateOrdersWithInventory(prev, newInv));
  };

  const handleRemoveLastRecord = (type) => {
    if (type === 'newOrder') {
      setNewOrder(prev => {
        if (prev.items.length === 0) return prev;
        const newItems = [...prev.items];
        const lastItem = { ...newItems[newItems.length - 1] };
        if (lastItem.quantity > 1) {
          lastItem.quantity -= 1;
          lastItem.missing -= 1;
          newItems[newItems.length - 1] = lastItem;
        } else {
          newItems.pop();
        }
        return { ...prev, items: newItems };
      });
    } else if (type === 'inventory') {
      setInvWizard(prev => {
        if (prev.items.length === 0) return prev;
        const newItems = [...prev.items];
        newItems.pop();
        return { ...prev, items: newItems };
      });
    } else if (type === 'history') {
      setHistoryWizard(prev => {
        if (prev.items.length === 0) return prev;
        const newItems = [...prev.items];
        const lastItem = { ...newItems[newItems.length - 1] };
        if (lastItem.qty > 1) {
          lastItem.qty -= 1;
          newItems[newItems.length - 1] = lastItem;
        } else {
          newItems.pop();
        }
        return { ...prev, items: newItems };
      });
    } else if (type === 'buy') {
      if (buyWizard.boughtItems.length === 0) return;
      const newBought = [...buyWizard.boughtItems];
      const lastItem = { ...newBought[newBought.length - 1] };
      const variantToUndo = lastItem.variant;
      const brandToUndo = buyWizard.brand;

      if (lastItem.qty > 1) {
        lastItem.qty -= 1;
        newBought[newBought.length - 1] = lastItem;
      } else {
        newBought.pop();
      }
      
      setBuyWizard({ ...buyWizard, boughtItems: newBought });

      setPendingOrders(prevOrders => {
        let actualOrders = [...prevOrders];
        let undone = false;
        for (let i = actualOrders.length - 1; i >= 0; i--) {
          let order = { ...actualOrders[i] };
          if (order.status !== 'pending') continue;
          let items = [...order.items];
          for (let j = items.length - 1; j >= 0; j--) {
            let item = { ...items[j] };
            if (item.brand === brandToUndo && item.variant === variantToUndo && item.sessionAllocated > 0) {
              item.missing += 1;
              item.allocated -= 1;
              item.sessionAllocated -= 1;
              items[j] = item;
              order.items = items;
              actualOrders[i] = order;
              undone = true;
              break;
            }
          }
          if (undone) break;
        }
        return recalculateOrdersWithInventory(actualOrders, inventory);
      });
    }
  };

  const handleXClick = (wizardType, currentVariant, setVariantFn) => {
    const now = Date.now();
    const timeDiff = now - lastXClickRef.current.time;
    const isDoubleClick = timeDiff < 400 && lastXClickRef.current.type === wizardType;

    if (isDoubleClick && lastXClickRef.current.variantWasEmpty) {
        handleRemoveLastRecord(wizardType);
        lastXClickRef.current = { time: 0, variantWasEmpty: false, type: '' };
    } else {
        setVariantFn(currentVariant.slice(0, -1));
        lastXClickRef.current = { time: now, variantWasEmpty: currentVariant === '', type: wizardType };
    }
  };

  // Statisztikák és Előrejelzések
  const stats = useMemo(() => {
    let soldItemsCount = 0;
    let totalProfit = 0;
    let totalRev = 0;
    let totalCost = 0;
    let successSalesCount = historyItems.length;
    let variantCounts = {};

    historyItems.forEach(item => {
      totalProfit += item.profit;
      item.items.forEach(i => {
        let cost = i.buyPrice * i.quantity;
        let rev = i.sellPrice * i.quantity;
        totalCost += cost;
        totalRev += rev;
        soldItemsCount += i.quantity;
        
        const key = `${i.brand} - ${i.variant}`;
        variantCounts[key] = (variantCounts[key] || 0) + i.quantity;
      });
    });

    let currentStockCount = inventory.reduce((sum, item) => sum + item.quantity, 0);
    
    let topProduct = 'Nincs adat';
    let maxSold = 0;
    Object.keys(variantCounts).forEach(key => {
      if (variantCounts[key] > maxSold) {
        maxSold = variantCounts[key];
        topProduct = key;
      }
    });

    const chartData = historyItems.slice(0, 10).reverse().map((item) => ({
      name: `#${item.id.toString().slice(-3)}`,
      profit: item.profit
    }));

    const weeklyPrediction = [
      { name: 'Most', Profit: totalProfit, Bevétel: totalRev, Költség: totalCost },
      { name: '+1 Hét', Profit: totalProfit * 2, Bevétel: totalRev * 2, Költség: totalCost * 2 },
      { name: '+2 Hét', Profit: totalProfit * 3, Bevétel: totalRev * 3, Költség: totalCost * 3 },
      { name: '+3 Hét', Profit: totalProfit * 4, Bevétel: totalRev * 4, Költség: totalCost * 4 },
    ];

    const monthlyPrediction = [
      { name: 'Most', Profit: totalProfit, Bevétel: totalRev, Költség: totalCost },
      { name: '+1 Hónap', Profit: totalProfit * 4, Bevétel: totalRev * 4, Költség: totalCost * 4 },
      { name: '+2 Hónap', Profit: totalProfit * 8, Bevétel: totalRev * 8, Költség: totalCost * 8 },
      { name: '+3 Hónap', Profit: totalProfit * 12, Bevétel: totalRev * 12, Költség: totalCost * 12 },
    ];

    return { totalProfit, totalRev, totalCost, soldItemsCount, currentStockCount, successSalesCount, topProduct, chartData, weeklyPrediction, monthlyPrediction };
  }, [historyItems, inventory]);

  const handleSmartOrder = async () => {
    if (!smartInput.trim()) return;
    setIsThinking(true);
    
    setTimeout(() => {
      let parsedName = "Vevő (AI)";
      let lowerInput = smartInput.toLowerCase();
      if (lowerInput.includes("gábor")) parsedName = "Gábor";
      else if (lowerInput.includes("peti")) parsedName = "Peti";
      
      let newItems = [];
      if (lowerInput.includes("7000")) newItems.push({ name: "Vape - 7000", brand: "Vape", variant: "7000", quantity: 2, missing: 2, allocated: 0, buyPrice: 0 });
      if (lowerInput.includes("10000")) newItems.push({ name: "Stagbar - 10000", brand: "Stagbar", variant: "10000", quantity: 1, missing: 1, allocated: 0, buyPrice: 0 });
      
      if (newItems.length === 0) {
        newItems.push({ name: "Vape - Ismeretlen", brand: "Vape", variant: "9999", quantity: 1, missing: 1, allocated: 0, buyPrice: 0 });
      }

      setNewOrder({ customerName: parsedName, items: [...newOrder.items, ...newItems] });
      setIsThinking(false);
      setSmartInput('');
    }, 1500);
  };

  const handleAddNewOrderItem = () => {
    if (!orderWizard.variant) return;
    const newItem = {
      name: `${orderWizard.brand} - ${orderWizard.variant}`,
      brand: orderWizard.brand,
      variant: orderWizard.variant,
      quantity: 1,
      missing: 1,
      allocated: 0,
      buyPrice: 0
    };
    
    const existingIndex = newOrder.items.findIndex(i => i.brand === newItem.brand && i.variant === newItem.variant);
    let updatedItems = [...newOrder.items];
    
    if (existingIndex >= 0) {
      updatedItems[existingIndex].quantity += 1;
      updatedItems[existingIndex].missing += 1;
    } else {
      updatedItems.push(newItem);
    }

    setNewOrder({ ...newOrder, items: updatedItems });
    setOrderWizard({ ...orderWizard, variant: '' });
  };

  const handleSaveNewOrder = () => {
    if (newOrder.items.length === 0) return;
    const newOrderObj = {
      id: Date.now(),
      customerName: newOrder.customerName || 'Névtelen',
      status: 'pending',
      items: newOrder.items.map(i => ({...i, allocated: 0, missing: i.quantity}))
    };
    const newOrders = [...pendingOrders, newOrderObj];
    setPendingOrders(recalculateOrdersWithInventory(newOrders, inventory));
    setNewOrder({ customerName: '', items: [] });
    handleTabChange('pickup');
  };

  const handleAddBuyVariant = () => {
    if (!buyWizard.currentVariant) return;
    
    let updatedBought = [...buyWizard.boughtItems];
    let existing = updatedBought.find(i => i.variant === buyWizard.currentVariant);
    
    if (existing) {
      existing.qty += 1;
    } else {
      updatedBought.push({ variant: buyWizard.currentVariant, qty: 1 });
    }

    let actualOrders = [...pendingOrders];
    let allocated = false;

    for (let order of actualOrders) {
      if (order.status !== 'pending') continue;
      for (let item of order.items) {
        if (item.brand === buyWizard.brand && item.variant === buyWizard.currentVariant && item.missing > 0) {
          item.missing -= 1;
          item.allocated += 1;
          item.sessionAllocated = (item.sessionAllocated || 0) + 1; 
          allocated = true;
          break; 
        }
      }
      if (allocated) break;
    }

    setPendingOrders(actualOrders);
    setBuyWizard({ ...buyWizard, boughtItems: updatedBought, currentVariant: '' });
  };

  const handleSaveBuySession = () => {
    const finalPrice = parseInt(buyWizard.price) || 0;
    let actualOrders = [...pendingOrders];
    
    actualOrders.forEach(order => {
      order.items.forEach(item => {
        if (item.sessionAllocated > 0) {
          item.buyPrice = finalPrice;
          delete item.sessionAllocated;
        }
      });
      if (order.status === 'pending') {
        const isReady = order.items.every(i => i.missing === 0);
        if (isReady) order.status = 'ready';
      }
    });

    let newInv = [...inventory];
    buyWizard.boughtItems.forEach(bought => {
      let existing = newInv.find(i => i.brand === buyWizard.brand && i.variant === bought.variant && i.buyPrice === finalPrice);
      if (existing) {
        existing.quantity += bought.qty;
      } else {
        newInv.push({ id: Date.now() + Math.random(), name: `${buyWizard.brand} - ${bought.variant}`, brand: buyWizard.brand, variant: bought.variant, quantity: bought.qty, buyPrice: finalPrice });
      }
    });

    setInventory(newInv);
    setPendingOrders(recalculateOrdersWithInventory(actualOrders, newInv));
    setBuyWizard({ brand: 'Vape', currentVariant: '', boughtItems: [], step: 'variants', price: '' });
  };

  const handleSellOrder = () => {
    const sellPrice = parseInt(sellWizard.price) || 0;
    const order = pendingOrders.find(o => o.id === sellWizard.orderId);
    
    if (order) {
      let totalBuyCost = 0;
      let totalSellRev = 0;
      
      const historyItemsToSave = order.items.map(item => {
        totalBuyCost += (item.buyPrice * item.quantity);
        totalSellRev += (sellPrice * item.quantity);
        return { ...item, sellPrice };
      });

      const profit = totalSellRev - totalBuyCost;
      let currentInv = [...inventory];
      
      order.items.forEach(item => {
        let qtyToDeduct = item.quantity;
        let invItem = currentInv.find(i => i.brand === item.brand && i.variant === item.variant && i.buyPrice === item.buyPrice);
        if (invItem) {
          let deduct = Math.min(invItem.quantity, qtyToDeduct);
          invItem.quantity -= deduct;
          qtyToDeduct -= deduct;
        }
        if (qtyToDeduct > 0) {
          let fallbackItem = currentInv.find(i => i.brand === item.brand && i.variant === item.variant);
          if (fallbackItem) {
            fallbackItem.quantity = Math.max(0, fallbackItem.quantity - qtyToDeduct);
          }
        }
      });
      
      const finalInv = currentInv.filter(i => i.quantity > 0);
      const remainingOrders = pendingOrders.filter(o => o.id !== sellWizard.orderId);

      setInventory(finalInv);
      setPendingOrders(recalculateOrdersWithInventory(remainingOrders, finalInv));

      setHistoryItems(prev => [{
        id: Date.now(),
        customerName: order.customerName,
        date: new Date().toISOString(),
        items: historyItemsToSave,
        profit
      }, ...prev]);
    }
    setSellWizard({ isOpen: false, orderId: null, price: '' });
  };

  const handleSaveInventory = () => {
    const finalPrice = parseInt(invWizard.price) || 0;
    let newItems = invWizard.items.map(variant => ({
      id: Date.now() + Math.random(),
      name: `${invWizard.brand} - ${variant}`,
      brand: invWizard.brand,
      variant: variant,
      quantity: 1,
      buyPrice: finalPrice
    }));

    const newInv = [...newItems, ...inventory];
    handleInventoryChange(newInv);
    setInvWizard({ isOpen: false, step: 'brand', brand: 'Vape', variant: '', items: [], price: '' });
  };

  const handleDeleteOrder = (id) => {
    setPendingOrders(prev => prev.filter(o => o.id !== id));
    setEditingOrderId(null);
  };

  const handleUpdateOrderItem = (orderId, itemIndex, delta) => {
    let actualOrders = [...pendingOrders];
    let orderIndex = actualOrders.findIndex(o => o.id === orderId);
    if (orderIndex === -1) return;
    
    let order = { ...actualOrders[orderIndex] };
    let newItems = [...order.items];
    let item = { ...newItems[itemIndex] };

    item.quantity += delta;
    if (item.quantity <= 0) {
      newItems.splice(itemIndex, 1);
    } else {
      newItems[itemIndex] = item;
    }

    order.items = newItems;
    actualOrders[orderIndex] = order;
    actualOrders = actualOrders.filter(o => o.items.length > 0);
    setPendingOrders(recalculateOrdersWithInventory(actualOrders, inventory));
  };

  // Múltbéli eladás rögzítése
  const handleAddHistoryVariant = () => {
    if (!historyWizard.currentVariant) return;
    let updatedItems = [...historyWizard.items];
    let existing = updatedItems.find(i => i.variant === historyWizard.currentVariant && i.brand === historyWizard.brand);
    
    if (existing) {
      existing.qty += 1;
    } else {
      updatedItems.push({ brand: historyWizard.brand, variant: historyWizard.currentVariant, qty: 1 });
    }
    setHistoryWizard({ ...historyWizard, items: updatedItems, currentVariant: '' });
  };

  const handleSaveHistoryWizard = () => {
    const buyPrice = parseInt(historyWizard.buyPrice) || 0;
    const sellPrice = parseInt(historyWizard.sellPrice) || 0;
    
    let totalBuyCost = 0;
    let totalSellRev = 0;

    const savedItems = historyWizard.items.map(item => {
      totalBuyCost += (buyPrice * item.qty);
      totalSellRev += (sellPrice * item.qty);
      return {
        name: `${item.brand} - ${item.variant}`,
        brand: item.brand,
        variant: item.variant,
        quantity: item.qty,
        buyPrice: buyPrice,
        sellPrice: sellPrice
      };
    });

    const profit = totalSellRev - totalBuyCost;

    const selectedDate = new Date(historyWizard.date);
    selectedDate.setHours(12, 0, 0, 0); 

    setHistoryItems(prev => [{
      id: Date.now(),
      customerName: 'Múltbéli rögzítés',
      date: selectedDate.toISOString(),
      items: savedItems,
      profit
    }, ...prev]);

    setHistoryWizard({ isOpen: false, step: 'variants', brand: 'Vape', currentVariant: '', items: [], buyPrice: '', sellPrice: '', date: new Date().toISOString().split('T')[0] });
  };

  const handleDeleteHistoryItem = (id) => {
    setHistoryItems(prev => prev.filter(item => item.id !== id));
  };

  // --- NÉZETEK ---
  const renderChartsModal = () => (
    <div className="fixed inset-0 bg-slate-50 z-[100] overflow-y-auto pb-24 animate-in slide-in-from-bottom-8">
      <div className="sticky top-0 bg-white border-b border-gray-200 p-4 shadow-sm flex justify-between items-center z-10">
        <h2 className="text-xl font-bold text-gray-800 flex items-center">
          <BarChart2 className="mr-2 text-indigo-600"/> Részletes Elemzések
        </h2>
        <button onClick={() => setShowChartsModal(false)} className="p-2 bg-gray-100 text-gray-600 rounded-full active:bg-gray-200">
          <X size={24} />
        </button>
      </div>

      <div className="p-4 space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <h3 className="font-bold text-gray-800 mb-4">Heti Előrejelzés</h3>
          <div className="h-64 w-full">
            {stats.weeklyPrediction[0].Profit > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.weeklyPrediction}>
                  <defs>
                    <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}/>
                  <Legend iconType="circle" wrapperStyle={{fontSize: '12px', paddingTop: '10px'}}/>
                  <Area type="monotone" dataKey="Bevétel" stroke="#3b82f6" fill="transparent" strokeWidth={2} />
                  <Area type="monotone" dataKey="Költség" stroke="#ef4444" fill="transparent" strokeWidth={2} />
                  <Area type="monotone" dataKey="Profit" stroke="#10b981" fill="url(#colorProfit)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm">Nincs még adat.</div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <h3 className="font-bold text-gray-800 mb-4">Havi Előrejelzés</h3>
          <div className="h-64 w-full">
            {stats.monthlyPrediction[0].Profit > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.monthlyPrediction}>
                   <defs>
                    <linearGradient id="colorProfitMonth" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}/>
                  <Area type="monotone" dataKey="Profit" stroke="#10b981" fill="url(#colorProfitMonth)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm">Nincs még adat.</div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <h3 className="font-bold text-gray-800 mb-4">Utolsó 10 Eladás</h3>
          <div className="h-48 w-full">
            {stats.chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.chartData}>
                  <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip cursor={{fill: '#f3f4f6'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}/>
                  <Bar dataKey="profit" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm">Nincs még adat.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderDashboard = () => (
    <div className="p-4 space-y-4 pb-24 animate-in slide-in-from-bottom-4">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <Sparkles className="absolute top-2 right-2 text-blue-300 opacity-20" size={64} />
        <h2 className="text-blue-100 text-sm font-medium mb-1">Teljes Profit</h2>
        <div className="text-4xl font-extrabold tracking-tight mb-4">
          {stats.totalProfit.toLocaleString()} Ft
        </div>
        <div className="flex justify-between items-center text-sm bg-black/10 rounded-xl p-3">
          <div>
            <div className="text-blue-200">Bevétel</div>
            <div className="font-bold text-green-300">+{stats.totalRev.toLocaleString()} Ft</div>
          </div>
          <div className="w-px h-8 bg-blue-400/30"></div>
          <div>
            <div className="text-blue-200">Költség</div>
            <div className="font-bold text-red-300">-{stats.totalCost.toLocaleString()} Ft</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
          <CartIcon className="text-indigo-500 mb-2" size={24} />
          <div className="text-2xl font-bold text-gray-800">{stats.soldItemsCount} db</div>
          <div className="text-xs text-gray-500 font-medium uppercase tracking-wider">Eladott</div>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
          <Box className="text-orange-500 mb-2" size={24} />
          <div className="text-2xl font-bold text-gray-800">{stats.currentStockCount} db</div>
          <div className="text-xs text-gray-500 font-medium uppercase tracking-wider">Készleten</div>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
          <Handshake className="text-green-500 mb-2" size={24} />
          <div className="text-2xl font-bold text-gray-800">{stats.successSalesCount}</div>
          <div className="text-xs text-gray-500 font-medium uppercase tracking-wider">Sikeres Üzlet</div>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
          <TrendingUp className="text-blue-500 mb-2" size={24} />
          <div className="text-lg font-bold text-gray-800 leading-tight">{stats.topProduct}</div>
          <div className="text-xs text-gray-500 font-medium uppercase tracking-wider">Sztár Termék</div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 relative overflow-hidden">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-gray-800 flex items-center">
            <TrendingUp size={18} className="mr-2 text-indigo-500" /> Előrejelzés (Trend)
          </h3>
          <button onClick={() => setShowChartsModal(true)} className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg flex items-center active:bg-indigo-100">
            <Maximize2 size={12} className="mr-1"/> Nagyítás
          </button>
        </div>
        <div className="h-32 w-full">
          {stats.weeklyPrediction[0].Profit > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.weeklyPrediction}>
                <defs>
                  <linearGradient id="colorProfitMini" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} labelStyle={{display:'none'}}/>
                <Area type="monotone" dataKey="Profit" stroke="#10b981" fill="url(#colorProfitMini)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400 text-sm">Nincs még adat.</div>
          )}
        </div>
      </div>

      <button onClick={() => setShowChartsModal(true)} className="w-full bg-indigo-600 text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center active:bg-indigo-700">
        <BarChart2 className="mr-2" /> 📊 Összes Grafikon Megnyitása
      </button>

      <div className="bg-indigo-50 rounded-2xl p-4 border border-indigo-100 flex items-start space-x-3">
        <div className="bg-indigo-100 p-2 rounded-full mt-1">
          <Bot size={20} className="text-indigo-600" />
        </div>
        <div>
          <h4 className="font-bold text-indigo-900 mb-1">AI Üzleti Asszisztens</h4>
          <p className="text-sm text-indigo-800">
            {stats.successSalesCount === 0 ? "Még nem adtál el semmit. Kezdd el az árusítást az Átvétel fülön!" : 
             stats.soldItemsCount > 10 ? `Kiváló munka! A(z) ${stats.topProduct} nagyon pörög, érdemes lehet betárazni belőle.` : 
             "Jó úton haladsz, folyamatosan vezesd a készletet és az eladásokat a pontos profitkövetéshez!"}
          </p>
        </div>
      </div>
    </div>
  );

  const renderNewOrder = () => (
    <div className="p-4 space-y-4 pb-24 animate-in slide-in-from-bottom-4">
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
          <Bot size={20} className="mr-2 text-indigo-500" /> Okos beillesztés
        </h2>
        <div className="flex space-x-2">
          <input 
            type="text" 
            placeholder="Másold be az üzenetet (pl. 2db 7000-es vape...)" 
            className="flex-1 border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none"
            value={smartInput}
            onChange={(e) => setSmartInput(e.target.value)}
          />
          <button 
            onClick={handleSmartOrder}
            disabled={isThinking || !smartInput}
            className="bg-indigo-600 text-white rounded-xl px-4 py-3 font-bold active:bg-indigo-700 disabled:opacity-50 flex items-center justify-center"
          >
            {isThinking ? <Loader2 className="animate-spin" size={20}/> : <Sparkles size={20}/>}
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="mb-4">
          <label className="block text-sm font-bold text-gray-700 mb-1">Megrendelő Neve (Opcionális)</label>
          <input 
            type="text" 
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-lg focus:border-blue-500 focus:outline-none"
            placeholder="Például: János"
            value={newOrder.customerName}
            onChange={e => setNewOrder({...newOrder, customerName: e.target.value})}
          />
        </div>

        <div className="mb-4">
           <div className="flex space-x-2 mb-4 bg-gray-100 p-1 rounded-xl">
             <button onClick={() => setOrderWizard({...orderWizard, brand: 'Vape'})} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${orderWizard.brand === 'Vape' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}>Vape</button>
             <button onClick={() => setOrderWizard({...orderWizard, brand: 'Stagbar'})} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${orderWizard.brand === 'Stagbar' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}>Stagbar</button>
           </div>

           <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
             <div className="text-center mb-4 text-gray-500 text-sm font-medium">Írd be a típust:</div>
             <div className="text-3xl font-bold text-center h-12 flex items-center justify-center tracking-widest text-blue-600 bg-white rounded-xl border-2 border-blue-100 mb-4 shadow-inner">
               {orderWizard.variant || '0'}
             </div>
             <div className="grid grid-cols-3 gap-3">
               {[1,2,3,4,5,6,7,8,9].map(num => (
                 <button key={num} onClick={() => setOrderWizard({...orderWizard, variant: orderWizard.variant + num})} className="bg-white rounded-xl shadow-sm py-3 text-xl font-bold text-gray-800 active:bg-gray-100">{num}</button>
               ))}
               <button onClick={() => handleXClick('newOrder', orderWizard.variant, (v) => setOrderWizard({...orderWizard, variant: v}))} className="bg-red-50 rounded-xl shadow-sm py-3 text-xl font-bold text-red-600 active:bg-red-100 flex justify-center items-center"><X size={24}/></button>
               <button onClick={() => setOrderWizard({...orderWizard, variant: orderWizard.variant + '0'})} className="bg-white rounded-xl shadow-sm py-3 text-xl font-bold text-gray-800 active:bg-gray-100">0</button>
               <button onClick={handleAddNewOrderItem} className="bg-blue-600 rounded-xl shadow-sm py-3 text-sm font-bold text-white active:bg-blue-700 flex flex-col items-center justify-center leading-none">
                 Hozzáad
               </button>
             </div>
           </div>
        </div>

        {newOrder.items.length > 0 && (
          <div className="mt-6 border-t pt-4">
            <h3 className="font-bold text-gray-700 mb-2">A kosár tartalma:</h3>
            <div className="space-y-2 mb-4">
              {newOrder.items.map((item, idx) => (
                <div key={idx} className="flex justify-between bg-blue-50 p-3 rounded-xl border border-blue-100">
                  <span className="font-medium text-blue-900">{item.name}</span>
                  <span className="font-bold text-blue-700">{item.quantity} db</span>
                </div>
              ))}
            </div>
            <button onClick={handleSaveNewOrder} className="w-full bg-green-500 text-white font-bold py-4 rounded-xl shadow-lg active:bg-green-600 text-lg flex justify-center items-center">
              <Check size={24} className="mr-2"/> Rendelés Mentése
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const renderPickup = () => (
    <div className="p-4 space-y-4 pb-24 animate-in slide-in-from-bottom-4">
      <div className="flex space-x-2 bg-gray-200 p-1 rounded-xl">
        <button onClick={() => setPickupMode('buy')} className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all flex justify-center items-center ${pickupMode === 'buy' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}>
          <ShoppingCart size={18} className="mr-2"/> Beszerzés
        </button>
        <button onClick={() => setPickupMode('sell')} className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all flex justify-center items-center ${pickupMode === 'sell' ? 'bg-white shadow text-green-600' : 'text-gray-500'}`}>
          <Handshake size={18} className="mr-2"/> Átadás
        </button>
      </div>

      {pickupMode === 'buy' ? (
        <>
          {buyWizard.step === 'variants' && (
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex space-x-2 mb-4 bg-gray-100 p-1 rounded-xl">
                <button onClick={() => setBuyWizard({...buyWizard, brand: 'Vape'})} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${buyWizard.brand === 'Vape' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}>Vape</button>
                <button onClick={() => setBuyWizard({...buyWizard, brand: 'Stagbar'})} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${buyWizard.brand === 'Stagbar' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}>Stagbar</button>
              </div>

              {buyWizard.boughtItems.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4 p-3 bg-blue-50 rounded-xl border border-blue-100">
                  {buyWizard.boughtItems.map((item, idx) => (
                    <span key={idx} className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-bold shadow-sm">
                      {item.variant} <span className="text-blue-200 ml-1">x{item.qty}</span>
                    </span>
                  ))}
                </div>
              )}

              <div className="text-3xl font-bold text-center h-14 flex items-center justify-center tracking-widest text-blue-600 bg-gray-50 rounded-xl border-2 border-blue-100 mb-4 shadow-inner">
                {buyWizard.currentVariant || 'Típus...'}
              </div>
              
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[1,2,3,4,5,6,7,8,9].map(num => (
                  <button key={num} onClick={() => setBuyWizard({...buyWizard, currentVariant: buyWizard.currentVariant + num})} className="bg-white border border-gray-200 rounded-xl shadow-sm py-4 text-2xl font-bold text-gray-800 active:bg-gray-100">{num}</button>
                ))}
                <button onClick={() => handleXClick('buy', buyWizard.currentVariant, (v) => setBuyWizard({...buyWizard, currentVariant: v}))} className="bg-red-50 border border-red-100 rounded-xl shadow-sm py-4 text-2xl font-bold text-red-600 active:bg-red-100 flex justify-center items-center"><X size={28}/></button>
                <button onClick={() => setBuyWizard({...buyWizard, currentVariant: buyWizard.currentVariant + '0'})} className="bg-white border border-gray-200 rounded-xl shadow-sm py-4 text-2xl font-bold text-gray-800 active:bg-gray-100">0</button>
                <button onClick={handleAddBuyVariant} className="bg-blue-600 rounded-xl shadow-sm py-4 text-xl font-bold text-white active:bg-blue-700 flex justify-center items-center">Hozzáad</button>
              </div>

              {buyWizard.boughtItems.length > 0 && (
                <button onClick={() => setBuyWizard({...buyWizard, step: 'price'})} className="w-full bg-indigo-600 text-white font-bold py-4 rounded-xl shadow-lg active:bg-indigo-700 text-lg flex justify-center items-center">
                  Tovább az árhoz <ArrowRight className="ml-2"/>
                </button>
              )}
            </div>
          )}

          {buyWizard.step === 'price' && (
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="font-bold text-center mb-4 text-gray-700">Mennyiért vetted darabját?</h3>
              <div className="text-4xl font-bold text-center h-16 flex items-center justify-center tracking-widest text-green-600 bg-gray-50 rounded-xl border-2 border-green-100 mb-4 shadow-inner">
                {buyWizard.price ? `${buyWizard.price} Ft` : '0 Ft'}
              </div>
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[1,2,3,4,5,6,7,8,9].map(num => (
                  <button key={num} onClick={() => setBuyWizard({...buyWizard, price: buyWizard.price + num})} className="bg-white border border-gray-200 rounded-xl shadow-sm py-4 text-2xl font-bold text-gray-800 active:bg-gray-100">{num}</button>
                ))}
                <button onClick={() => setBuyWizard({...buyWizard, price: buyWizard.price.slice(0,-1)})} className="bg-red-50 border border-red-100 rounded-xl shadow-sm py-4 text-2xl font-bold text-red-600 active:bg-red-100 flex justify-center items-center"><X size={28}/></button>
                <button onClick={() => setBuyWizard({...buyWizard, price: buyWizard.price + '0'})} className="bg-white border border-gray-200 rounded-xl shadow-sm py-4 text-2xl font-bold text-gray-800 active:bg-gray-100">0</button>
                <button onClick={() => setBuyWizard({...buyWizard, price: buyWizard.price + '00'})} className="bg-gray-100 border border-gray-200 rounded-xl shadow-sm py-4 text-xl font-bold text-gray-800 active:bg-gray-200">00</button>
              </div>
              <button onClick={handleSaveBuySession} className="w-full bg-green-500 text-white font-bold py-4 rounded-xl shadow-lg active:bg-green-600 text-xl flex justify-center items-center">
                <Check className="mr-2"/> Rögzítés
              </button>
            </div>
          )}

          <div className="space-y-3">
            <h3 className="font-bold text-gray-700">Függőben lévő rendelések:</h3>
            {pendingOrders.filter(o => o.status === 'pending').map(order => (
              <div key={order.id} className="bg-white border-l-4 border-orange-400 p-3 rounded-r-xl shadow-sm relative">
                <div className="flex justify-between items-start mb-2">
                  <div className="font-bold text-gray-800">{order.customerName}</div>
                  <button onClick={() => setEditingOrderId(editingOrderId === order.id ? null : order.id)} className="text-gray-400 hover:text-blue-600 p-1 bg-gray-50 rounded">
                    {editingOrderId === order.id ? <Check size={18} className="text-green-500" /> : <Edit size={18} />}
                  </button>
                </div>
                
                {editingOrderId === order.id ? (
                  <div className="space-y-2 animate-in fade-in">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-gray-50 p-2 rounded border border-gray-100">
                        <span className="text-sm font-medium text-gray-700">{item.name}</span>
                        <div className="flex items-center space-x-3">
                          <button onClick={() => handleUpdateOrderItem(order.id, idx, -1)} className="w-8 h-8 rounded bg-red-100 text-red-600 font-bold flex justify-center items-center">-</button>
                          <span className="font-bold w-4 text-center">{item.quantity}</span>
                          <button onClick={() => handleUpdateOrderItem(order.id, idx, 1)} className="w-8 h-8 rounded bg-green-100 text-green-600 font-bold flex justify-center items-center">+</button>
                        </div>
                      </div>
                    ))}
                    <button onClick={() => handleDeleteOrder(order.id)} className="w-full mt-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold py-2 rounded-lg text-sm border border-red-100 flex justify-center items-center transition-colors">
                      <Trash2 size={16} className="mr-1"/> Rendelés törlése
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">{item.name} <span className="font-bold">({item.quantity}db)</span></span>
                        {item.missing === 0 ? (
                          <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-bold flex items-center"><Check size={12} className="mr-1"/> Kiosztva</span>
                        ) : (
                          <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded text-xs font-bold flex items-center">Hiányzik: {item.missing}db</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {pendingOrders.filter(o => o.status === 'pending').length === 0 && (
              <div className="text-center py-6 text-gray-500">Nincs függőben lévő rendelés.</div>
            )}
          </div>
        </>
      ) : (
        <>
          {sellWizard.isOpen ? (
             <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
               <div className="flex justify-between items-center mb-4">
                 <h3 className="font-bold text-gray-700">Eladási ár (darab):</h3>
                 <button onClick={() => setSellWizard({isOpen:false, orderId:null, price:''})} className="text-gray-400 bg-gray-100 p-1 rounded-full"><X size={20}/></button>
               </div>
               <div className="text-4xl font-bold text-center h-16 flex items-center justify-center tracking-widest text-green-600 bg-gray-50 rounded-xl border-2 border-green-100 mb-4 shadow-inner">
                 {sellWizard.price ? `${sellWizard.price} Ft` : '0 Ft'}
               </div>
               <div className="grid grid-cols-3 gap-3 mb-4">
                 {[1,2,3,4,5,6,7,8,9].map(num => (
                   <button key={num} onClick={() => setSellWizard({...sellWizard, price: sellWizard.price + num})} className="bg-white border border-gray-200 rounded-xl shadow-sm py-4 text-2xl font-bold text-gray-800 active:bg-gray-100">{num}</button>
                 ))}
                 <button onClick={() => setSellWizard({...sellWizard, price: sellWizard.price.slice(0,-1)})} className="bg-red-50 border border-red-100 rounded-xl shadow-sm py-4 text-2xl font-bold text-red-600 active:bg-red-100 flex justify-center items-center"><X size={28}/></button>
                 <button onClick={() => setSellWizard({...sellWizard, price: sellWizard.price + '0'})} className="bg-white border border-gray-200 rounded-xl shadow-sm py-4 text-2xl font-bold text-gray-800 active:bg-gray-100">0</button>
                 <button onClick={() => setSellWizard({...sellWizard, price: sellWizard.price + '00'})} className="bg-gray-100 border border-gray-200 rounded-xl shadow-sm py-4 text-xl font-bold text-gray-800 active:bg-gray-200">00</button>
               </div>
               <button onClick={handleSellOrder} className="w-full bg-green-500 text-white font-bold py-4 rounded-xl shadow-lg active:bg-green-600 text-xl flex justify-center items-center">
                 <Handshake className="mr-2"/> Eladás rögzítése
               </button>
             </div>
          ) : (
            <div className="space-y-3">
              <h3 className="font-bold text-gray-700">Átadásra kész rendelések:</h3>
              {pendingOrders.filter(o => o.status === 'ready').map(order => (
                <div key={order.id} className="bg-white border-l-4 border-green-500 p-4 rounded-r-xl shadow-sm flex flex-col space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="font-bold text-gray-800 text-lg">{order.customerName}</div>
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-bold uppercase">Kész</span>
                  </div>
                  <div className="space-y-1 bg-gray-50 p-2 rounded text-sm">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-gray-600">
                        <span>{item.name}</span>
                        <span className="font-bold">{item.quantity} db</span>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => setSellWizard({isOpen: true, orderId: order.id, price: ''})} className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-lg flex justify-center items-center shadow-sm">
                    <DollarSign size={18} className="mr-1"/> Eladva
                  </button>
                </div>
              ))}
              {pendingOrders.filter(o => o.status === 'ready').length === 0 && (
                <div className="text-center py-6 text-gray-500">Nincs összekészített rendelés.</div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );

  const renderInventory = () => (
    <div className="p-4 space-y-4 pb-24 animate-in slide-in-from-bottom-4">
      {invWizard.isOpen ? (
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
           {invWizard.step === 'brand' && (
             <>
               <h3 className="font-bold text-center mb-4 text-gray-700">Válassz márkát</h3>
               <div className="flex flex-col space-y-3">
                 <button onClick={() => setInvWizard({...invWizard, brand: 'Vape', step: 'variants'})} className="bg-blue-50 text-blue-700 font-bold py-4 rounded-xl text-xl border border-blue-200">Vape</button>
                 <button onClick={() => setInvWizard({...invWizard, brand: 'Stagbar', step: 'variants'})} className="bg-purple-50 text-purple-700 font-bold py-4 rounded-xl text-xl border border-purple-200">Stagbar</button>
               </div>
             </>
           )}
           {invWizard.step === 'variants' && (
             <>
               <h3 className="font-bold text-center mb-2 text-gray-700">Írd be a típust</h3>
               {invWizard.items.length > 0 && (
                 <div className="flex flex-wrap gap-2 mb-4 p-2 bg-gray-50 rounded-lg">
                   {invWizard.items.map((it, idx) => <span key={idx} className="bg-gray-200 px-2 py-1 rounded text-sm font-bold">{it}</span>)}
                 </div>
               )}
               <div className="text-3xl font-bold text-center h-14 flex items-center justify-center tracking-widest text-blue-600 bg-gray-50 rounded-xl border-2 border-blue-100 mb-4 shadow-inner">
                 {invWizard.variant || '0'}
               </div>
               <div className="grid grid-cols-3 gap-3 mb-4">
                 {[1,2,3,4,5,6,7,8,9].map(num => (
                   <button key={num} onClick={() => setInvWizard({...invWizard, variant: invWizard.variant + num})} className="bg-white border border-gray-200 rounded-xl shadow-sm py-4 text-2xl font-bold text-gray-800 active:bg-gray-100">{num}</button>
                 ))}
                 <button onClick={() => handleXClick('inventory', invWizard.variant, (v) => setInvWizard({...invWizard, variant: v}))} className="bg-red-50 border border-red-100 rounded-xl shadow-sm py-4 text-2xl font-bold text-red-600 active:bg-red-100 flex justify-center items-center"><X size={28}/></button>
                 <button onClick={() => setInvWizard({...invWizard, variant: invWizard.variant + '0'})} className="bg-white border border-gray-200 rounded-xl shadow-sm py-4 text-2xl font-bold text-gray-800 active:bg-gray-100">0</button>
                 <button onClick={() => setInvWizard({...invWizard, items: [...invWizard.items, invWizard.variant], variant: ''})} className="bg-blue-100 rounded-xl shadow-sm py-4 text-blue-700 active:bg-blue-200 flex justify-center items-center"><Plus size={32}/></button>
               </div>
               {invWizard.items.length > 0 && (
                  <button onClick={() => setInvWizard({...invWizard, step: 'price'})} className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg active:bg-blue-700 text-lg flex justify-center items-center">
                    Tovább az árhoz ({invWizard.items.length} típus) <ArrowRight className="ml-2"/>
                  </button>
               )}
             </>
           )}
           {invWizard.step === 'price' && (
             <>
               <h3 className="font-bold text-center mb-4 text-gray-700">Mennyiért vetted (Egységár)?</h3>
               <div className="text-4xl font-bold text-center h-16 flex items-center justify-center tracking-widest text-green-600 bg-gray-50 rounded-xl border-2 border-green-100 mb-4 shadow-inner">
                 {invWizard.price ? `${invWizard.price} Ft` : '0 Ft'}
               </div>
               <div className="grid grid-cols-3 gap-3 mb-4">
                 {[1,2,3,4,5,6,7,8,9].map(num => (
                   <button key={num} onClick={() => setInvWizard({...invWizard, price: invWizard.price + num})} className="bg-white border border-gray-200 rounded-xl shadow-sm py-4 text-2xl font-bold text-gray-800 active:bg-gray-100">{num}</button>
                 ))}
                 <button onClick={() => setInvWizard({...invWizard, price: invWizard.price.slice(0,-1)})} className="bg-red-50 border border-red-100 rounded-xl shadow-sm py-4 text-2xl font-bold text-red-600 active:bg-red-100 flex justify-center items-center"><X size={28}/></button>
                 <button onClick={() => setInvWizard({...invWizard, price: invWizard.price + '0'})} className="bg-white border border-gray-200 rounded-xl shadow-sm py-4 text-2xl font-bold text-gray-800 active:bg-gray-100">0</button>
                 <button onClick={() => setInvWizard({...invWizard, price: invWizard.price + '00'})} className="bg-gray-100 border border-gray-200 rounded-xl shadow-sm py-4 text-xl font-bold text-gray-800 active:bg-gray-200">00</button>
               </div>
               <button onClick={handleSaveInventory} className="w-full bg-green-500 text-white font-bold py-4 rounded-xl shadow-lg active:bg-green-600 text-xl flex justify-center items-center">
                 <Check className="mr-2"/> Készlet Mentése
               </button>
             </>
           )}
        </div>
      ) : (
        <button onClick={() => setInvWizard({isOpen: true, step: 'brand', brand: 'Vape', variant: '', items: [], price: ''})} className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center active:bg-blue-700">
          <Plus className="mr-2" /> Új Áru Érkezett
        </button>
      )}

      {!invWizard.isOpen && inventory.length > 0 && (
        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-4 rounded-2xl border border-indigo-100 shadow-sm space-y-3">
          <h3 className="font-bold text-indigo-900 flex items-center"><Box size={18} className="mr-2"/> Készlet Összegzés</h3>
          {Object.entries(
            inventory.reduce((acc, item) => {
              const key = `${item.brand}_${item.buyPrice}`;
              if (!acc[key]) acc[key] = { brand: item.brand, price: item.buyPrice, total: 0, variants: [] };
              acc[key].total += item.quantity;
              if (item.quantity > 0) acc[key].variants.push(item.variant);
              return acc;
            }, {})
          ).map(([key, group]) => group.total > 0 && (
            <div key={key} className="bg-white p-3 rounded-xl shadow-sm border border-indigo-50">
              <div className="flex justify-between items-center mb-2">
                <span className="font-extrabold text-lg text-gray-800">{group.total} db <span className="text-sm text-gray-500 font-medium">({group.brand})</span></span>
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-bold">{group.price} Ft/db</span>
              </div>
              <div className="text-xs text-gray-500 flex flex-wrap gap-1">
                {group.variants.map((v, i) => <span key={i} className="bg-gray-100 px-1.5 py-0.5 rounded">{v}</span>)}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-3">
        <h3 className="font-bold text-gray-700">Részletes Készlet (Szerkeszthető):</h3>
        {inventory.map((item, idx) => (
          <div key={item.id} className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div className="flex-1">
              <div className="font-bold text-gray-800 mb-1">{item.name}</div>
              <div className="flex items-center space-x-2">
                <input 
                  type="number" 
                  value={item.quantity} 
                  onChange={(e) => {
                    let newInv = [...inventory];
                    newInv[idx].quantity = parseInt(e.target.value) || 0;
                    handleInventoryChange(newInv);
                  }}
                  className="w-16 bg-gray-50 border border-gray-200 rounded p-1 text-center font-bold text-blue-600"
                />
                <span className="text-sm text-gray-500">db</span>
                <span className="text-gray-300">|</span>
                <input 
                  type="number" 
                  value={item.buyPrice} 
                  onChange={(e) => {
                    let newInv = [...inventory];
                    newInv[idx].buyPrice = parseInt(e.target.value) || 0;
                    handleInventoryChange(newInv);
                  }}
                  className="w-20 bg-gray-50 border border-gray-200 rounded p-1 text-center font-bold text-green-600"
                />
                <span className="text-sm text-gray-500">Ft</span>
              </div>
            </div>
            <button onClick={() => handleInventoryChange(inventory.filter(i => i.id !== item.id))} className="p-2 text-red-400 hover:bg-red-50 rounded-lg">
              <X size={20} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  const renderHistory = () => (
    <div className="p-4 space-y-4 pb-24 animate-in slide-in-from-bottom-4">
      
      {historyWizard.isOpen ? (
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 animate-in fade-in">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-800">Múltbéli Eladás Rögzítése</h3>
            <button onClick={() => setHistoryWizard({isOpen:false, step:'variants', brand:'Vape', currentVariant:'', items:[], buyPrice:'', sellPrice:'', date: new Date().toISOString().split('T')[0]})} className="p-1 bg-gray-100 rounded-full text-gray-500"><X size={20}/></button>
          </div>

          {historyWizard.step === 'variants' && (
            <>
              <div className="flex space-x-2 mb-4 bg-gray-100 p-1 rounded-xl">
                <button onClick={() => setHistoryWizard({...historyWizard, brand: 'Vape'})} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${historyWizard.brand === 'Vape' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}>Vape</button>
                <button onClick={() => setHistoryWizard({...historyWizard, brand: 'Stagbar'})} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${historyWizard.brand === 'Stagbar' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}>Stagbar</button>
              </div>
              {historyWizard.items.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4 p-3 bg-blue-50 rounded-xl border border-blue-100">
                  {historyWizard.items.map((item, idx) => (
                    <span key={idx} className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-bold shadow-sm">
                      {item.variant} <span className="text-blue-200 ml-1">x{item.qty}</span>
                    </span>
                  ))}
                </div>
              )}
              <div className="text-3xl font-bold text-center h-14 flex items-center justify-center tracking-widest text-blue-600 bg-gray-50 rounded-xl border-2 border-blue-100 mb-4 shadow-inner">
                {historyWizard.currentVariant || 'Típus...'}
              </div>
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[1,2,3,4,5,6,7,8,9].map(num => (
                  <button key={num} onClick={() => setHistoryWizard({...historyWizard, currentVariant: historyWizard.currentVariant + num})} className="bg-white border border-gray-200 rounded-xl shadow-sm py-4 text-2xl font-bold text-gray-800 active:bg-gray-100">{num}</button>
                ))}
                <button onClick={() => handleXClick('history', historyWizard.currentVariant, (v) => setHistoryWizard({...historyWizard, currentVariant: v}))} className="bg-red-50 border border-red-100 rounded-xl shadow-sm py-4 text-2xl font-bold text-red-600 active:bg-red-100 flex justify-center items-center"><X size={28}/></button>
                <button onClick={() => setHistoryWizard({...historyWizard, currentVariant: historyWizard.currentVariant + '0'})} className="bg-white border border-gray-200 rounded-xl shadow-sm py-4 text-2xl font-bold text-gray-800 active:bg-gray-100">0</button>
                <button onClick={handleAddHistoryVariant} className="bg-blue-600 rounded-xl shadow-sm py-4 text-xl font-bold text-white active:bg-blue-700 flex justify-center items-center">Hozzáad</button>
              </div>
              {historyWizard.items.length > 0 && (
                <button onClick={() => setHistoryWizard({...historyWizard, step: 'buyPrice'})} className="w-full bg-indigo-600 text-white font-bold py-4 rounded-xl shadow-lg active:bg-indigo-700 text-lg flex justify-center items-center">
                  Tovább az árakhoz <ArrowRight className="ml-2"/>
                </button>
              )}
            </>
          )}

          {historyWizard.step === 'buyPrice' && (
            <>
              <h3 className="font-bold text-center mb-4 text-gray-700">Vételi Egységár:</h3>
              <div className="text-4xl font-bold text-center h-16 flex items-center justify-center tracking-widest text-orange-500 bg-gray-50 rounded-xl border-2 border-orange-100 mb-4 shadow-inner">
                 {historyWizard.buyPrice ? `${historyWizard.buyPrice} Ft` : '0 Ft'}
              </div>
              <div className="grid grid-cols-3 gap-3 mb-4">
                 {[1,2,3,4,5,6,7,8,9].map(num => (
                   <button key={num} onClick={() => setHistoryWizard({...historyWizard, buyPrice: historyWizard.buyPrice + num})} className="bg-white border border-gray-200 rounded-xl shadow-sm py-4 text-2xl font-bold text-gray-800 active:bg-gray-100">{num}</button>
                 ))}
                 <button onClick={() => setHistoryWizard({...historyWizard, buyPrice: historyWizard.buyPrice.slice(0,-1)})} className="bg-red-50 border border-red-100 rounded-xl shadow-sm py-4 text-2xl font-bold text-red-600 active:bg-red-100 flex justify-center items-center"><X size={28}/></button>
                 <button onClick={() => setHistoryWizard({...historyWizard, buyPrice: historyWizard.buyPrice + '0'})} className="bg-white border border-gray-200 rounded-xl shadow-sm py-4 text-2xl font-bold text-gray-800 active:bg-gray-100">0</button>
                 <button onClick={() => setHistoryWizard({...historyWizard, buyPrice: historyWizard.buyPrice + '00'})} className="bg-gray-100 border border-gray-200 rounded-xl shadow-sm py-4 text-xl font-bold text-gray-800 active:bg-gray-200">00</button>
              </div>
              <button onClick={() => setHistoryWizard({...historyWizard, step: 'sellPrice'})} className="w-full bg-indigo-600 text-white font-bold py-4 rounded-xl shadow-lg active:bg-indigo-700 text-lg flex justify-center items-center">
                  Eladási ár megadása <ArrowRight className="ml-2"/>
              </button>
            </>
          )}

          {historyWizard.step === 'sellPrice' && (
            <>
              <h3 className="font-bold text-center mb-4 text-gray-700">Eladási Egységár:</h3>
              <div className="text-4xl font-bold text-center h-16 flex items-center justify-center tracking-widest text-green-600 bg-gray-50 rounded-xl border-2 border-green-100 mb-4 shadow-inner">
                 {historyWizard.sellPrice ? `${historyWizard.sellPrice} Ft` : '0 Ft'}
              </div>
              <div className="grid grid-cols-3 gap-3 mb-4">
                 {[1,2,3,4,5,6,7,8,9].map(num => (
                   <button key={num} onClick={() => setHistoryWizard({...historyWizard, sellPrice: historyWizard.sellPrice + num})} className="bg-white border border-gray-200 rounded-xl shadow-sm py-4 text-2xl font-bold text-gray-800 active:bg-gray-100">{num}</button>
                 ))}
                 <button onClick={() => setHistoryWizard({...historyWizard, sellPrice: historyWizard.sellPrice.slice(0,-1)})} className="bg-red-50 border border-red-100 rounded-xl shadow-sm py-4 text-2xl font-bold text-red-600 active:bg-red-100 flex justify-center items-center"><X size={28}/></button>
                 <button onClick={() => setHistoryWizard({...historyWizard, sellPrice: historyWizard.sellPrice + '0'})} className="bg-white border border-gray-200 rounded-xl shadow-sm py-4 text-2xl font-bold text-gray-800 active:bg-gray-100">0</button>
                 <button onClick={() => setHistoryWizard({...historyWizard, sellPrice: historyWizard.sellPrice + '00'})} className="bg-gray-100 border border-gray-200 rounded-xl shadow-sm py-4 text-xl font-bold text-gray-800 active:bg-gray-200">00</button>
              </div>
              <button onClick={() => setHistoryWizard({...historyWizard, step: 'date'})} className="w-full bg-indigo-600 text-white font-bold py-4 rounded-xl shadow-lg active:bg-indigo-700 text-lg flex justify-center items-center">
                  Tovább a dátumhoz <ArrowRight className="ml-2"/>
              </button>
            </>
          )}

          {historyWizard.step === 'date' && (
            <>
              <h3 className="font-bold text-center mb-4 text-gray-700">Mikor történt az eladás?</h3>
              <div className="mb-6">
                <input
                  type="date"
                  value={historyWizard.date}
                  onChange={(e) => setHistoryWizard({...historyWizard, date: e.target.value})}
                  className="w-full text-center text-2xl font-bold bg-gray-50 border-2 border-indigo-100 rounded-xl py-4 text-indigo-700 focus:outline-none focus:border-indigo-500 shadow-inner"
                />
              </div>
              <button onClick={handleSaveHistoryWizard} className="w-full bg-green-500 text-white font-bold py-4 rounded-xl shadow-lg active:bg-green-600 text-xl flex justify-center items-center">
                 <Check className="mr-2"/> Rögzítés a Történetbe
              </button>
            </>
          )}

        </div>
      ) : (
        <button onClick={() => setHistoryWizard({isOpen: true, step: 'variants', brand: 'Vape', currentVariant: '', items: [], buyPrice: '', sellPrice: '', date: new Date().toISOString().split('T')[0]})} className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl shadow-sm flex items-center justify-center active:bg-indigo-700">
          <Plus className="mr-2" size={20} /> Múltbéli eladás rögzítése
        </button>
      )}

      <h2 className="text-xl font-bold text-gray-800 mt-2">Eladási Történet</h2>
      {historyItems.length === 0 ? (
        <div className="text-center py-10 text-gray-500 bg-white rounded-2xl border border-gray-100">
          <History className="mx-auto text-gray-300 mb-3" size={48} />
          Még nincsenek lezárt rendelések.
        </div>
      ) : (
        <div className="space-y-3">
          {historyItems.map((item) => (
            <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 relative group">
              <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-50 pr-8">
                <div className="font-bold text-gray-800">{item.customerName}</div>
                <div className="text-xs text-gray-400">{new Date(item.date).toLocaleDateString('hu-HU', {month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit'})}</div>
              </div>
              <button onClick={() => handleDeleteHistoryItem(item.id)} className="absolute top-3 right-3 text-red-400 hover:text-red-600 p-1 bg-red-50 rounded-lg transition-colors">
                <Trash2 size={18} />
              </button>
              <div className="space-y-1 mb-3">
                {item.items.map((i, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className="text-gray-600">{i.name} <span className="font-medium">({i.quantity}db)</span></span>
                    <span className="text-gray-500">{i.sellPrice} Ft/db</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-gray-50">
                <span className="text-sm font-medium text-gray-500">Realizált Haszon:</span>
                <span className={`font-bold ${item.profit >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {item.profit >= 0 ? '+' : ''}{item.profit} Ft
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      <div className="bg-white border-b border-gray-200 p-4 sticky top-0 z-10 shadow-sm flex justify-center items-center">
        <h1 className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 tracking-tight">
          DropManager
        </h1>
      </div>

      <main className="max-w-md mx-auto relative h-full">
        {showChartsModal && renderChartsModal()}
        {!showChartsModal && activeTab === 'dashboard' && renderDashboard()}
        {!showChartsModal && activeTab === 'new' && renderNewOrder()}
        {!showChartsModal && activeTab === 'pickup' && renderPickup()}
        {!showChartsModal && activeTab === 'inventory' && renderInventory()}
        {!showChartsModal && activeTab === 'history' && renderHistory()}
      </main>

      {/* Bottom Navigation */}
      {!showChartsModal && (
        <div className="fixed bottom-0 w-full bg-white border-t border-gray-200 px-2 py-2 flex justify-between items-center pb-safe z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
          <button onClick={() => handleTabChange('dashboard')} className={`flex flex-col items-center p-2 w-16 transition-colors ${activeTab === 'dashboard' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}>
            <Home size={24} className={activeTab === 'dashboard' ? 'stroke-[2.5px]' : ''}/>
            <span className="text-[10px] font-bold mt-1">Balance</span>
          </button>
          <button onClick={() => handleTabChange('pickup')} className={`flex flex-col items-center p-2 w-16 transition-colors ${activeTab === 'pickup' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}>
            <Hash size={24} className={activeTab === 'pickup' ? 'stroke-[2.5px]' : ''}/>
            <span className="text-[10px] font-bold mt-1">Átvétel</span>
          </button>
          
          <div className="relative -top-5">
            <button 
              onClick={() => handleTabChange('new')} 
              className={`bg-blue-600 text-white p-4 rounded-full shadow-xl shadow-blue-200 transform transition-transform active:scale-95 ${activeTab === 'new' ? 'ring-4 ring-blue-100' : ''}`}
            >
              <Plus size={28} className="stroke-[3px]" />
            </button>
          </div>

          <button onClick={() => handleTabChange('inventory')} className={`flex flex-col items-center p-2 w-16 transition-colors ${activeTab === 'inventory' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}>
            <Package size={24} className={activeTab === 'inventory' ? 'stroke-[2.5px]' : ''}/>
            <span className="text-[10px] font-bold mt-1">Készlet</span>
          </button>
          <button onClick={() => handleTabChange('history')} className={`flex flex-col items-center p-2 w-16 transition-colors ${activeTab === 'history' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}>
            <History size={24} className={activeTab === 'history' ? 'stroke-[2.5px]' : ''}/>
            <span className="text-[10px] font-bold mt-1">Történet</span>
          </button>
        </div>
      )}
    </div>
  );
}