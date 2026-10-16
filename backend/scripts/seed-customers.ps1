param(
  [string]$ApiBase = "http://localhost:8080"
)

$companies = @(
  "Metalicas Norte", "Aluminios Vega", "Hierros Costa", "Carpinteria Arista",
  "Estructuras Sol", "Aluon Demo", "Fachadas Rivas", "Forja Urbina",
  "Cerrajeria Atlas", "Estructuras M2"
)
$cities = @("Madrid","Sevilla","Valencia","Bilbao","Malaga","Zaragoza","Alicante","Murcia","Valladolid","Oviedo")
$provinces = @("Madrid","Sevilla","Valencia","Bizkaia","Malaga","Zaragoza","Alicante","Murcia","Valladolid","Asturias")
$tarifas = @("A","B","C","VIP","PREMIUM","GENERAL")
$formasPago = @("TRANSFERENCIA","GIRO","TARJETA","CONTADO")
$docTypes = @("CIF","DNI","NIE","PASAPORTE")

function New-RandomPhone {
  $n = Get-Random -Minimum 600000000 -Maximum 799999999
  return $n.ToString()
}

function New-RandomIban {
  $n = Get-Random -Minimum 10000000000000000000 -Maximum 99999999999999999999
  return "ES" + $n.ToString()
}

function New-Customer($i) {
  $company = $companies[$i % $companies.Count]
  $city = $cities[$i % $cities.Count]
  $province = $provinces[$i % $provinces.Count]
  $contact = "Contacto " + ($i + 1)
  return @{
    nombreComercial = $company.ToUpper()
    razonSocial = "$company S.L."
    personaContacto = $contact.ToUpper()
    tarifa = $tarifas[(Get-Random -Minimum 0 -Maximum $tarifas.Count)]
    tipoDocumento = $docTypes[(Get-Random -Minimum 0 -Maximum $docTypes.Count)]
    telefono = New-RandomPhone
    email = ("info{0}@{1}.com" -f ($i + 1), $company.Replace(" ", "").ToLower())
    direccion = ("C/ Principal {0}" -f (Get-Random -Minimum 1 -Maximum 200))
    cp = (Get-Random -Minimum 10000 -Maximum 52999).ToString()
    poblacion = $city.ToUpper()
    provincia = $province.ToUpper()
    pais = "ESPAÑA"
    iban = New-RandomIban
    formaPago = $formasPago[(Get-Random -Minimum 0 -Maximum $formasPago.Count)]
    diasVencimiento = (Get-Random -Minimum 0 -Maximum 90)
    remanente = 0
    direccionesEntrega = @()
  }
}

Write-Host "Seeding 10 customers to $ApiBase/api/customers ..."

for ($i = 0; $i -lt 10; $i++) {
  $body = New-Customer $i | ConvertTo-Json -Depth 5
  $bytes = [System.Text.Encoding]::UTF8.GetBytes($body)
  try {
    Invoke-RestMethod -Method Post -Uri "$ApiBase/api/customers" -ContentType "application/json; charset=utf-8" -Body $bytes | Out-Null
  } catch {
    Write-Error "Failed to seed customer ${i}: $($_.Exception.Message)"
  }
}

Write-Host "Done."
