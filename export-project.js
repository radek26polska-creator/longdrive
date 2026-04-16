$outputFile = "project_export.txt"
$excludeDirs = @("node_modules", ".git", "dist", "build", ".cache")
$excludeFiles = @("project_export.txt", "package-lock.json")

# Usuń stary plik jeśli istnieje
if (Test-Path $outputFile) { Remove-Item $outputFile }

"=" * 80 | Out-File -FilePath $outputFile -Encoding UTF8
"EKSPORT PROJEKTU" | Out-File -FilePath $outputFile -Append -Encoding UTF8
"Data: $(Get-Date)" | Out-File -FilePath $outputFile -Append -Encoding UTF8
"=" * 80 | Out-File -FilePath $outputFile -Append -Encoding UTF8
"" | Out-File -FilePath $outputFile -Append -Encoding UTF8

Get-ChildItem -Recurse -File | Where-Object {
    $excludeDirs -notcontains $_.Directory.Name -and 
    $excludeFiles -notcontains $_.Name
} | ForEach-Object {
    "`n" + "=" * 80 | Out-File -FilePath $outputFile -Append -Encoding UTF8
    "PLIK: $($_.FullName)" | Out-File -FilePath $outputFile -Append -Encoding UTF8
    "=" * 80 | Out-File -FilePath $outputFile -Append -Encoding UTF8
    Get-Content $_.FullName -Raw | Out-File -FilePath $outputFile -Append -Encoding UTF8
    Write-Host "Dodano: $($_.Name)"
}

Write-Host "`nGotowe! Plik: $outputFile"