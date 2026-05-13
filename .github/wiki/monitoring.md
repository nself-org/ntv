# Monitoring

ɳTV uses nSelf's built-in monitoring stack. No extra setup is needed.

For the full reference, see the [CLI Monitoring Guide](https://github.com/nself-org/cli/wiki/monitoring).

## ɳTV-specific dashboards

When the monitoring stack is running, Grafana includes these ɳTV panels:

- **Active streams** — live viewer count across all channels
- **Encoding jobs** — transcoding queue depth and job duration (requires ɳTV bundle)
- **Bandwidth usage** — egress per stream and total (helps forecast Hetzner traffic costs)
- **EPG fetch latency** — time to refresh the electronic program guide (requires ɳTV bundle)

## Enable

Monitoring is on by default. Verify with:

```bash
nself status --monitoring
```
