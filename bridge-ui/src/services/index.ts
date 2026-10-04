/**
 * services 统一出口
 * ═══════════════════════════════════════════════════════════
 * 上层统一从 '@/services' 导入，不用记具体文件名。
 * 这样以后拆分 / 重命名内部文件不会波及调用方。
 */

export { http, request, ApiError, hasBackend, type RequestOptions } from './api'
export { askPet, type PetAskInput, type PetAnswer, type PetMessage } from './ai'
