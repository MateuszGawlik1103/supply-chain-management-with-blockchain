import { useState, useEffect } from 'react';
import api from '#api/api';
import { useAuth } from '#context/AuthContext';
import styles from './BatchHistory.module.css';

interface BatchStep {
  status: string;
  productOwner?: string;
  quantity?: number;
  temperature?: number;
  humidity?: number;
  orderId?: string;
  timestamp: string;
  rawTimestamp: number;
  originFarm: string;
  transport: string;
  location: string;
  qualityCheck: string;
  packagingType: string;
  roastLevel: string;
  displayName: string;
}

interface OrderDetails {
  orderId: string;
  coffeeType: string;
  description: string;
  quantity: number;
  orderingOrg: string;
  orderDate: string;
}

interface UserBatch {
  batch_id: string;
  display_name: string;
  coffee_type: string;
}

const statusDescriptions: Record<string, string> = {
  READY_FOR_DELIVERY: "Preparing for delivery",
  IN_TRANSIT: "In transit",
  DELIVERED: "Delivered",
};

export const BatchHistory = () => {
  const [batchId, setBatchId] = useState('');
  const [history, setHistory] = useState<BatchStep[]>([]);
  const [avgTemp, setAvgTemp] = useState<number | null>(null);
  const [avgHumidity, setAvgHumidity] = useState<number | null>(null);
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [batch, setBatch] = useState<BatchStep | null>(null);
  const [userBatches, setUserBatches] = useState<UserBatch[]>([]);
  const { token } = useAuth();

  useEffect(() => {
    const fetchUserBatches = async () => {
      try {
        const res = await api.get('/my-history', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUserBatches(res.data.history);
      } catch (err: any) {
        console.error(err);
      }
    };
    fetchUserBatches();
  }, [token]);

  const handleFetch = async (id?: string) => {
    const targetBatchId = id || batchId;
    if (!targetBatchId) return;

    try {
      const res = await api.get(`/batch/${targetBatchId}/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const simplified: BatchStep[] = res.data.map((step: any) => ({
        status: step.value.status,
        productOwner: step.value.productOwner,
        quantity: step.value.quantity,
        temperature: step.value.temperature,
        humidity: step.value.humidity,
        orderId: step.value.orderId,
        originFarm: step.value.originFarm,
        transport: step.value.transport,
        location: step.value.location,
        qualityCheck: step.value.qualityCheck,
        packagingType: step.value.packagingType,
        roastLevel: step.value.roastLevel,
        displayName: step.value.displayName,
        rawTimestamp: step.timestamp.seconds * 1000,
        timestamp: new Date(step.timestamp.seconds * 1000).toLocaleString()
      }));

      const latestTransit = simplified
        .filter(s => s.status === "IN_TRANSIT")
        .sort((a, b) => b.rawTimestamp - a.rawTimestamp)[0];

      const others = simplified.filter(s => s.status !== "IN_TRANSIT");
      const filtered = [...others, latestTransit].filter(Boolean).sort((a, b) => a.rawTimestamp - b.rawTimestamp);

      setHistory(filtered);

      const validTemps = simplified.filter(s => s.temperature != null).map(s => s.temperature!);
      setAvgTemp(validTemps.length ? validTemps.reduce((a, b) => a + b, 0) / validTemps.length : null);

      const validHumidity = simplified.filter(s => s.humidity != null).map(s => s.humidity!);
      setAvgHumidity(validHumidity.length ? validHumidity.reduce((a, b) => a + b, 0) / validHumidity.length : null);

      let orderRes: any = null;

      const firstWithOrder = simplified.find(s => s.orderId);
      if (firstWithOrder?.orderId) {
          orderRes = await api.get(`/order/${firstWithOrder.orderId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setOrder(orderRes.data);
      }

      const batchRes = await api.get(`/batch/${targetBatchId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setUserBatches(prev => {
        const exists = prev.some(b => b.batch_id === targetBatchId);
        if (exists) return prev;

        return [
          ...prev,
          {
            batch_id: targetBatchId,
            display_name: batchRes.data.displayName,
            coffee_type: orderRes?.data?.coffeeType
          }
        ];
      });

      setBatch(batchRes.data);


    } catch (err: any) {
      alert(err.response?.data?.error || 'Error');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.inputSection}>
        <select
          value={batchId}
          onChange={e => {
            setBatchId(e.target.value);
            handleFetch(e.target.value);
          }}
        >
          <option value="">Select a batch from your history</option>
          {userBatches.map(b => (
            <option key={b.batch_id} value={b.batch_id}>
              {b.display_name} ({b.coffee_type})
            </option>
          ))}
        </select>
        <input
          placeholder="Or enter Batch ID"
          value={batchId}
          onChange={e => setBatchId(e.target.value)}
          onBlur={() => handleFetch(batchId)}
        />
        <button onClick={() => handleFetch()}>Check</button>
      </div>

      {order && (
        <div className={styles.orderDetails}>
          <h1>{batch?.displayName}</h1>
          <img src={`/${order.coffeeType}.png`} alt={order.coffeeType} />
          <p><strong>Description:</strong> {order.description}</p>
          <p><strong>Coffee Type:</strong> {order.coffeeType}</p>
          <p><strong>Packaging Type:</strong> {batch?.packagingType}</p>
          <p><strong>Roast Level:</strong> {batch?.roastLevel}</p>
        </div>
      )}

      {history.length > 0 && (
        <ul className={styles.historyList}>
          {history.map((step, index) => (
            <li key={index} className={styles.historyItem}>
              <strong>Status:</strong>
              {statusDescriptions[step.status] || step.status}<br />
              {step.productOwner &&
                <><strong>Owner:</strong> {step.productOwner}<br /></>}
              {(step.status === 'READY_FOR_DELIVERY') &&
                step.originFarm && <><strong>Origin Farm:</strong>
                {step.originFarm}<br /></>}
              {(step.transport != null) &&
                <><strong>Form of transport:</strong>
                {step.transport}<br /></>}
              {(step.status === 'IN_TRANSIT') && 
                <><strong>Average Temperature in transport:</strong>
                {avgTemp ?? "N/A"} °C<br /></>}
              {(step.status === 'IN_TRANSIT') &&
                <><strong>Average Humidity in transport:</strong>
                {avgHumidity ?? "N/A"} %<br /></>}
              {step.location &&
                <><strong>Location:</strong> {step.location}<br /></>}
              {step.qualityCheck &&
                <><strong>Quality check:</strong>
                {step.qualityCheck}<br /></>}
              <strong>Time:</strong> {step.timestamp}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default BatchHistory;
