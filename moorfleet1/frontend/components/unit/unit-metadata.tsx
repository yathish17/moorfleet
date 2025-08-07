import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { MooringUnit } from "@/lib/types"
import { Info, Calendar, CheckCircle, XCircle, MapPin, User, Globe } from "lucide-react"

interface UnitMetadataProps {
  unit: MooringUnit
}

export function UnitMetadata({ unit }: UnitMetadataProps) {
  return (
    <section>
      <h2 className="text-xl font-semibold mb-4">Unit Metadata</h2>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-muted-foreground" />
            Technical Specifications & Contract Details
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="font-medium text-muted-foreground">Serial No.:</span>
            <span>{unit.serialNumber}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-muted-foreground">Asset Type:</span>
            <span>{unit.assetType}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium text-muted-foreground">Installation Year:</span>
            <span>{unit.installationYear}</span>
          </div>
          <div className="flex items-center gap-2">
            {unit.slaActive ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <XCircle className="h-4 w-4 text-red-500" />
            )}
            <span className="font-medium text-muted-foreground">SLA Active:</span>
            <span>{unit.slaActive ? "Yes" : "No"}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium text-muted-foreground">Commissioned Year:</span>
            <span>{unit.commissionedYear}</span>
          </div>
          <div className="flex items-center gap-2">
            {unit.dataConsent ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <XCircle className="h-4 w-4 text-red-500" />
            )}
            <span className="font-medium text-muted-foreground">Data Consent:</span>
            <span>{unit.dataConsent ? "Yes" : "No"}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-muted-foreground">Warranty:</span>
            <span className={unit.warrantyStatus === "Expired" ? "text-red-500" : "text-green-500"}>
              {unit.warrantyStatus}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium text-muted-foreground">Site Name:</span>
            <span>{unit.siteName}</span>
          </div>
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium text-muted-foreground">End User:</span>
            <span>{unit.endUser}</span>
          </div>
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium text-muted-foreground">Country:</span>
            <span>{unit.country}</span>
          </div>
        </CardContent>
      </Card>
    </section>
  )
}
