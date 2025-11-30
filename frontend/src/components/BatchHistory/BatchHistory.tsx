import { useState } from 'react';
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
}

interface OrderDetails {
  orderId: string;
  coffeeType: string;
  description: string;
  quantity: number;
  orderingOrg: string;
  orderDate: string;
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

  const { token } = useAuth();

  const handleFetch = async () => {
    try {
      const res = await api.get(`/batch/${batchId}/history`, {
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
        rawTimestamp: step.timestamp.seconds * 1000,
        timestamp: new Date(step.timestamp.seconds * 1000).toLocaleString()
      }));

      const latestTransit = simplified
        .filter(s => s.status === "IN_TRANSIT")
        .sort((a, b) => b.rawTimestamp - a.rawTimestamp)[0];

      const others = simplified.filter(s => s.status !== "IN_TRANSIT");

      const filtered = [...others, latestTransit].filter(Boolean)
        .sort((a, b) => a.rawTimestamp - b.rawTimestamp);

      setHistory(filtered);

      const validTemps = simplified.filter(s => s.temperature != null).map(s => s.temperature!);
      const avgT = validTemps.length ? validTemps.reduce((a, b) => a + b, 0) / validTemps.length : null;

      const validHumidity = simplified.filter(s => s.humidity != null).map(s => s.humidity!);
      const avgH = validHumidity.length ? validHumidity.reduce((a, b) => a + b, 0) / validHumidity.length : null;

      setAvgTemp(avgT);
      setAvgHumidity(avgH);

      const firstWithOrder = simplified.find(s => s.orderId);
      if (firstWithOrder?.orderId) {
        const orderRes = await api.get(`/order/${firstWithOrder.orderId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setOrder(orderRes.data);
      }

      const batchRes = await api.get(`/batch/${batchId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBatch(batchRes.data);

    } catch (err: any) {
      alert(err.response?.data?.error || 'Error');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.inputSection}>
        <input placeholder="Batch ID" value={batchId} onChange={e => setBatchId(e.target.value)} />
        <button onClick={handleFetch}>Check</button>
      </div>

      {order && (
        <div className={styles.orderDetails}>
          <h1>{order.coffeeType}</h1>
          <img src={`/${order.coffeeType}.png`} alt={order.coffeeType} />
          <p><strong>Description:</strong> {order.description}</p>
          <p><strong>Packaging Type:</strong> {batch?.packagingType}</p>
          <p><strong>Roast Level:</strong> {batch?.roastLevel}</p>
        </div>
      )}

      {history.length > 0 && (
        <ul className={styles.historyList}>
          {history.map((step, index) => (
            <li key={index} className={styles.historyItem}>
              <strong>Status:</strong> {statusDescriptions[step.status] || step.status}<br />
              {step.productOwner && <><strong>Owner:</strong> {step.productOwner}<br /></>}
              {(step.status === 'READY_FOR_DELIVERY') && step.originFarm && <><strong>Origin Farm:</strong> {step.originFarm}<br /></>}
              {(step.transport != null) && <><strong>Form of transport:</strong> {step.transport}<br /></>}
              {(step.status === 'IN_TRANSIT') && <><strong>Average Temperature in transport:</strong> {avgTemp ?? "N/A"} °C<br /></>}
              {(step.status === 'IN_TRANSIT') && <><strong>Average Humidity in transport:</strong> {avgHumidity ?? "N/A"} %<br /></>}
              {step.location && <><strong>Location:</strong> {step.location}<br /></>}
              {step.qualityCheck && <><strong>Quality check:</strong> {step.qualityCheck}<br /></>}
              <strong>Time:</strong> {step.timestamp}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default BatchHistory;
