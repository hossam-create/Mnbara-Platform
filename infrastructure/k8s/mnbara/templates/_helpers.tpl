{{/*
Expand the name of the chart.
*/}}
{{- define "mnbara.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
*/}}
{{- define "mnbara.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "mnbara.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "mnbara.labels" -}}
helm.sh/chart: {{ include "mnbara.chart" . }}
{{ include "mnbara.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- with .Values.commonLabels }}
{{ toYaml . }}
{{- end }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "mnbara.selectorLabels" -}}
app.kubernetes.io/name: {{ include "mnbara.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "mnbara.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "mnbara.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}

{{/*
Service labels for a specific service
*/}}
{{- define "mnbara.serviceLabels" -}}
{{- $root := index . 0 -}}
{{- $serviceName := index . 1 -}}
helm.sh/chart: {{ include "mnbara.chart" $root }}
app.kubernetes.io/name: {{ $serviceName }}
app.kubernetes.io/instance: {{ $root.Release.Name }}
{{- if $root.Chart.AppVersion }}
app.kubernetes.io/version: {{ $root.Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ $root.Release.Service }}
app.kubernetes.io/component: {{ $serviceName }}
app.kubernetes.io/part-of: mnbara-platform
{{- end }}

{{/*
Service selector labels
*/}}
{{- define "mnbara.serviceSelectorLabels" -}}
{{- $root := index . 0 -}}
{{- $serviceName := index . 1 -}}
app.kubernetes.io/name: {{ $serviceName }}
app.kubernetes.io/instance: {{ $root.Release.Name }}
{{- end }}

{{/*
Database URL helper
*/}}
{{- define "mnbara.databaseUrl" -}}
{{- $host := printf "%s-postgresql" .Release.Name -}}
{{- $port := "5432" -}}
{{- $database := .Values.postgresql.auth.database -}}
{{- $user := .Values.postgresql.auth.username -}}
postgresql://{{ $user }}:$(DATABASE_PASSWORD)@{{ $host }}:{{ $port }}/{{ $database }}
{{- end }}

{{/*
Redis URL helper
*/}}
{{- define "mnbara.redisUrl" -}}
{{- $host := printf "%s-redis-master" .Release.Name -}}
redis://:$(REDIS_PASSWORD)@{{ $host }}:6379
{{- end }}

{{/*
RabbitMQ URL helper
*/}}
{{- define "mnbara.rabbitmqUrl" -}}
{{- $host := printf "%s-rabbitmq" .Release.Name -}}
{{- $user := .Values.rabbitmq.auth.username -}}
amqp://{{ $user }}:$(RABBITMQ_PASSWORD)@{{ $host }}:5672
{{- end }}

{{/*
Elasticsearch URL helper
*/}}
{{- define "mnbara.elasticsearchUrl" -}}
{{- $host := printf "%s-elasticsearch" .Release.Name -}}
http://{{ $host }}:9200
{{- end }}

{{/*
MinIO URL helper
*/}}
{{- define "mnbara.minioUrl" -}}
{{- $host := printf "%s-minio" .Release.Name -}}
http://{{ $host }}:9000
{{- end }}

{{/*
Image helper
*/}}
{{- define "mnbara.image" -}}
{{- $registry := .root.Values.image.registry -}}
{{- $repository := .service.image.repository -}}
{{- $tag := default .root.Values.image.tag .service.image.tag -}}
{{- if $registry }}
{{- printf "%s/%s:%s" $registry $repository $tag }}
{{- else }}
{{- printf "%s:%s" $repository $tag }}
{{- end }}
{{- end }}
