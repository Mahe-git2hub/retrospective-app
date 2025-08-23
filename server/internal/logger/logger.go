package logger

import (
	"encoding/json"
	"fmt"
	"log"
	"os"
	"time"
)

type Level int

const (
	DEBUG Level = iota
	INFO
	WARN
	ERROR
	FATAL
)

func (l Level) String() string {
	switch l {
	case DEBUG:
		return "DEBUG"
	case INFO:
		return "INFO"
	case WARN:
		return "WARN"
	case ERROR:
		return "ERROR"
	case FATAL:
		return "FATAL"
	default:
		return "UNKNOWN"
	}
}

type Logger struct {
	level  Level
	format string
}

type LogEntry struct {
	Timestamp string      `json:"timestamp"`
	Level     string      `json:"level"`
	Message   string      `json:"message"`
	Data      interface{} `json:"data,omitempty"`
}

var defaultLogger *Logger

func init() {
	defaultLogger = New("info", "text")
}

func New(levelStr, format string) *Logger {
	level := parseLevel(levelStr)
	return &Logger{
		level:  level,
		format: format,
	}
}

func parseLevel(levelStr string) Level {
	switch levelStr {
	case "debug":
		return DEBUG
	case "info":
		return INFO
	case "warn":
		return WARN
	case "error":
		return ERROR
	case "fatal":
		return FATAL
	default:
		return INFO
	}
}

func (l *Logger) log(level Level, message string, data interface{}) {
	if level < l.level {
		return
	}

	entry := LogEntry{
		Timestamp: time.Now().UTC().Format(time.RFC3339),
		Level:     level.String(),
		Message:   message,
		Data:      data,
	}

	if l.format == "json" {
		jsonData, err := json.Marshal(entry)
		if err != nil {
			log.Printf("Failed to marshal log entry: %v", err)
			return
		}
		fmt.Fprintln(os.Stdout, string(jsonData))
	} else {
		if data != nil {
			fmt.Printf("[%s] %s %s - %+v\n", entry.Timestamp, entry.Level, entry.Message, data)
		} else {
			fmt.Printf("[%s] %s %s\n", entry.Timestamp, entry.Level, entry.Message)
		}
	}
}

func (l *Logger) Debug(message string) {
	l.log(DEBUG, message, nil)
}

func (l *Logger) Debugf(format string, args ...interface{}) {
	l.log(DEBUG, fmt.Sprintf(format, args...), nil)
}

func (l *Logger) Info(message string) {
	l.log(INFO, message, nil)
}

func (l *Logger) Infof(format string, args ...interface{}) {
	l.log(INFO, fmt.Sprintf(format, args...), nil)
}

func (l *Logger) Warn(message string) {
	l.log(WARN, message, nil)
}

func (l *Logger) Warnf(format string, args ...interface{}) {
	l.log(WARN, fmt.Sprintf(format, args...), nil)
}

func (l *Logger) Error(message string) {
	l.log(ERROR, message, nil)
}

func (l *Logger) Errorf(format string, args ...interface{}) {
	l.log(ERROR, fmt.Sprintf(format, args...), nil)
}

func (l *Logger) ErrorWithData(message string, data interface{}) {
	l.log(ERROR, message, data)
}

func (l *Logger) Fatal(message string) {
	l.log(FATAL, message, nil)
	os.Exit(1)
}

func (l *Logger) Fatalf(format string, args ...interface{}) {
	l.log(FATAL, fmt.Sprintf(format, args...), nil)
	os.Exit(1)
}

// Package level functions using default logger
func Debug(message string) {
	defaultLogger.Debug(message)
}

func Debugf(format string, args ...interface{}) {
	defaultLogger.Debugf(format, args...)
}

func Info(message string) {
	defaultLogger.Info(message)
}

func Infof(format string, args ...interface{}) {
	defaultLogger.Infof(format, args...)
}

func Warn(message string) {
	defaultLogger.Warn(message)
}

func Warnf(format string, args ...interface{}) {
	defaultLogger.Warnf(format, args...)
}

func Error(message string) {
	defaultLogger.Error(message)
}

func Errorf(format string, args ...interface{}) {
	defaultLogger.Errorf(format, args...)
}

func ErrorWithData(message string, data interface{}) {
	defaultLogger.ErrorWithData(message, data)
}

func Fatal(message string) {
	defaultLogger.Fatal(message)
}

func Fatalf(format string, args ...interface{}) {
	defaultLogger.Fatalf(format, args...)
}

func SetDefault(logger *Logger) {
	defaultLogger = logger
}