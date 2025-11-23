import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Driver {
  id: number;
  name: string;
  trips: number;
  harshEvents: number;
  idleTime: number;
  score: number;
}

interface DriverScoreTableProps {
  drivers: Driver[];
}

const DriverScoreTable = ({ drivers }: DriverScoreTableProps) => {
  const getColor = (score: number) => {
    if (score >= 85) return "text-green-600 font-bold";
    if (score >= 70) return "text-yellow-600 font-medium";
    return "text-red-600 font-medium";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 85) return "Excellent";
    if (score >= 70) return "Good";
    return "Needs Improvement";
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Driver</TableHead>
            <TableHead>Trips</TableHead>
            <TableHead>Harsh Events</TableHead>
            <TableHead>Idle Time</TableHead>
            <TableHead>MoovScore</TableHead>
            <TableHead>Performance</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {drivers.map((d) => (
            <TableRow key={d.id}>
              <TableCell className="font-medium">{d.name}</TableCell>
              <TableCell>{d.trips}</TableCell>
              <TableCell>
                <span className={d.harshEvents > 5 ? "text-red-600" : d.harshEvents > 2 ? "text-yellow-600" : "text-green-600"}>
                  {d.harshEvents}
                </span>
              </TableCell>
              <TableCell>
                <span className={d.idleTime > 30 ? "text-red-600" : d.idleTime > 15 ? "text-yellow-600" : "text-green-600"}>
                  {d.idleTime} mins
                </span>
              </TableCell>
              <TableCell className={getColor(d.score)}>{d.score}%</TableCell>
              <TableCell>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  d.score >= 85 ? "bg-green-100 text-green-800" :
                  d.score >= 70 ? "bg-yellow-100 text-yellow-800" :
                  "bg-red-100 text-red-800"
                }`}>
                  {getScoreLabel(d.score)}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default DriverScoreTable;