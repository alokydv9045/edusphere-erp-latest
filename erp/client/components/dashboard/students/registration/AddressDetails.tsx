"use client";

import { UseFormReturn } from "react-hook-form";
import { StudentRegistrationValues } from "@/lib/validators/student";
import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

interface AddressDetailsProps {
    form: UseFormReturn<StudentRegistrationValues>;
    onNext: () => void;
    onPrev: () => void;
}

export default function AddressDetails({ form, onNext, onPrev }: AddressDetailsProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Address Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Current Address */}
                <div className="space-y-4">
                    <h4 className="text-sm font-medium">Current Address</h4>
                    <FormField
                        control={form.control}
                        name="currentAddress"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Address <span className="text-red-500">*</span></FormLabel>
                                <FormControl>
                                    <Textarea placeholder="Street Address" className="resize-none" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField
                            control={form.control}
                            name="city"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>City <span className="text-red-500">*</span></FormLabel>
                                    <FormControl>
                                        <Input placeholder="City" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="state"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>State <span className="text-red-500">*</span></FormLabel>
                                    <FormControl>
                                        <Input placeholder="State" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="pincode"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Pincode <span className="text-red-500">*</span></FormLabel>
                                    <FormControl>
                                        <Input placeholder="Pincode" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                {/* Permanent Address */}
                <div className="space-y-4 pt-4 border-t">
                    <div className="flex items-center space-x-2">
                        <h4 className="text-sm font-medium">Permanent Address</h4>
                        <span className="text-xs text-muted-foreground">(Optional)</span>
                    </div>

                    <FormField
                        control={form.control}
                        name="permanentAddress"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Address</FormLabel>
                                <FormControl>
                                    <Textarea placeholder="Permanent Address" className="resize-none" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>


                <div className="flex justify-between pt-4">
                    <Button type="button" variant="outline" onClick={onPrev}>Previous</Button>
                    <Button type="button" onClick={onNext}>Review & Submit</Button>
                </div>
            </CardContent>
        </Card>
    );
}
